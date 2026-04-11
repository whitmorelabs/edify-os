"""HeartbeatScheduler -- asyncio-based background task that fires proactive scans.

Design: a single long-lived asyncio task wakes up every 15 minutes and checks
which heartbeats are due based on config + last-run timestamps stored in DB or
memory. This avoids adding APScheduler as a dependency.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any

import asyncpg

from src.heartbeat.config import HeartbeatConfigManager
from src.heartbeat.executor import HeartbeatExecutor
from src.heartbeat.models import HeartbeatConfig
from src.heartbeat.notifier import HeartbeatNotifier

logger = logging.getLogger(__name__)

# In-memory fallback: (org_id, archetype) -> last run datetime (UTC)
_LAST_RUN: dict[tuple[str, str], datetime] = {}

# Tick interval: wake up every 15 minutes to check what's due.
_TICK_SECONDS = 15 * 60


class HeartbeatScheduler:
    """Manages recurring heartbeat scans for all orgs.

    The scheduler is a single asyncio background task. It checks every 15
    minutes which (org, archetype) pairs are due for a scan based on their
    ``frequency_hours`` setting and the last time they ran. It respects
    ``active_start`` / ``active_end`` in the org's configured timezone.

    The executor and notifier are built lazily per scan using a factory
    callable injected at construction time. This keeps the scheduler itself
    free of API-key and DB concerns.

    Parameters
    ----------
    db_pool : asyncpg.Pool | None
        Shared database pool (or None for dev mode).
    executor_factory : callable
        ``async (org_id, archetype) -> HeartbeatExecutor`` -- called each scan.
    org_context_factory : callable
        ``async (org_id) -> dict`` -- returns {"org_name": ..., "org_mission": ...}.
    api_key_factory : callable
        ``async (org_id) -> str | None`` -- returns the org's Anthropic API key.
    """

    def __init__(
        self,
        db_pool: asyncpg.Pool | None,
        executor_factory: Any = None,
        org_context_factory: Any = None,
        api_key_factory: Any = None,
    ) -> None:
        self._pool = db_pool
        self._executor_factory = executor_factory
        self._org_context_factory = org_context_factory
        self._api_key_factory = api_key_factory
        self._config_manager = HeartbeatConfigManager(db_pool=db_pool)
        self._notifier = HeartbeatNotifier(db_pool=db_pool)
        self._task: asyncio.Task | None = None
        self._running = False

        # Per-org, per-archetype overrides set via schedule_org()
        self._org_configs: dict[str, list[HeartbeatConfig]] = {}
        self._paused: set[tuple[str, str]] = set()

    # ------------------------------------------------------------------
    # Public lifecycle
    # ------------------------------------------------------------------

    async def start(self) -> None:
        """Load active configs from DB and start the background tick loop."""
        logger.info("HeartbeatScheduler starting.")
        self._running = True
        self._task = asyncio.create_task(self._tick_loop(), name="heartbeat-scheduler")

    async def stop(self) -> None:
        """Stop the scheduler gracefully."""
        logger.info("HeartbeatScheduler stopping.")
        self._running = False
        if self._task is not None and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("HeartbeatScheduler stopped.")

    # ------------------------------------------------------------------
    # Job management
    # ------------------------------------------------------------------

    async def schedule_org(
        self,
        org_id: str,
        configs: list[HeartbeatConfig],
    ) -> None:
        """Register or replace heartbeat configs for an org.

        The scheduler will pick these up on the next tick.
        """
        self._org_configs[org_id] = configs
        logger.info(
            "HeartbeatScheduler: registered %d configs for org=%s",
            len(configs),
            org_id,
        )

    async def pause_archetype(self, org_id: str, archetype: str) -> None:
        """Prevent a specific archetype from running for an org."""
        key = (org_id, archetype)
        self._paused.add(key)
        logger.info("HeartbeatScheduler: paused org=%s archetype=%s", org_id, archetype)

    async def resume_archetype(
        self,
        org_id: str,
        archetype: str,
        config: HeartbeatConfig,
    ) -> None:
        """Re-enable a paused archetype and update its config."""
        key = (org_id, archetype)
        self._paused.discard(key)
        if org_id in self._org_configs:
            self._org_configs[org_id] = [
                cfg if cfg.archetype != archetype else config
                for cfg in self._org_configs[org_id]
            ]
            # Append if not already present
            if not any(cfg.archetype == archetype for cfg in self._org_configs[org_id]):
                self._org_configs[org_id].append(config)
        else:
            self._org_configs[org_id] = [config]
        logger.info("HeartbeatScheduler: resumed org=%s archetype=%s", org_id, archetype)

    # ------------------------------------------------------------------
    # Tick loop
    # ------------------------------------------------------------------

    async def _tick_loop(self) -> None:
        """Main loop: wake every 15 minutes, check what's due, run scans."""
        logger.info("HeartbeatScheduler tick loop started (interval=%ds).", _TICK_SECONDS)
        while self._running:
            try:
                await self._process_due_scans()
            except Exception:
                logger.warning("Heartbeat tick error (continuing).", exc_info=True)

            try:
                await asyncio.sleep(_TICK_SECONDS)
            except asyncio.CancelledError:
                break

        logger.info("HeartbeatScheduler tick loop exited.")

    async def _process_due_scans(self) -> None:
        """Check all configs and fire scans that are overdue."""
        # Merge DB configs with in-process overrides
        if self._pool is not None:
            db_configs = await self._config_manager.get_all_active_configs()
        else:
            db_configs = []

        # Build the full set: DB configs + in-memory overrides (overrides win)
        all_configs: dict[tuple[str, str], HeartbeatConfig] = {
            (cfg.org_id, cfg.archetype): cfg for cfg in db_configs
        }
        for org_id, configs in self._org_configs.items():
            for cfg in configs:
                all_configs[(org_id, cfg.archetype)] = cfg

        now_utc = datetime.now(timezone.utc)

        for key, cfg in all_configs.items():
            if not cfg.enabled:
                continue
            if key in self._paused:
                continue
            if not self._is_active_window(cfg, now_utc):
                continue
            if not self._is_due(key, cfg, now_utc):
                continue

            # Fire the scan
            asyncio.create_task(
                self._run_scan_safe(cfg, now_utc),
                name=f"heartbeat-{cfg.org_id}-{cfg.archetype}",
            )

    def _is_active_window(self, cfg: HeartbeatConfig, now_utc: datetime) -> bool:
        """Return True if the current time falls within the org's active hours."""
        try:
            import zoneinfo  # Python 3.9+
            tz = zoneinfo.ZoneInfo(cfg.timezone)
            local_now = now_utc.astimezone(tz)
            return cfg.active_start <= local_now.hour <= cfg.active_end
        except Exception:
            # If timezone lookup fails, default to allowing the scan
            logger.debug("Timezone lookup failed for %s -- allowing scan.", cfg.timezone)
            return True

    def _is_due(
        self,
        key: tuple[str, str],
        cfg: HeartbeatConfig,
        now_utc: datetime,
    ) -> bool:
        """Return True if this archetype scan is overdue based on last run time."""
        last_run = _LAST_RUN.get(key)
        if last_run is None:
            return True  # Never run -- fire immediately
        elapsed_hours = (now_utc - last_run).total_seconds() / 3600
        return elapsed_hours >= cfg.frequency_hours

    async def _run_scan_safe(self, cfg: HeartbeatConfig, now_utc: datetime) -> None:
        """Run a scan, record the last-run time, and deliver the result."""
        key = (cfg.org_id, cfg.archetype)
        _LAST_RUN[key] = now_utc  # Mark as running to prevent double-fire

        logger.info(
            "HeartbeatScheduler: firing scan org=%s archetype=%s",
            cfg.org_id,
            cfg.archetype,
        )

        try:
            if self._executor_factory is None or self._org_context_factory is None:
                logger.debug(
                    "No executor_factory configured -- skipping scan for %s/%s",
                    cfg.org_id,
                    cfg.archetype,
                )
                return

            # Resolve org context and API key
            org_context: dict = await self._org_context_factory(cfg.org_id)
            org_name: str = org_context.get("org_name", cfg.org_id)
            org_mission: str = org_context.get("org_mission", "")

            executor: HeartbeatExecutor = await self._executor_factory(cfg.org_id, cfg.archetype)
            result = await executor.run_scan(
                archetype=cfg.archetype,
                org_name=org_name,
                org_mission=org_mission,
            )
            await self._notifier.deliver(result)

        except Exception:
            logger.exception(
                "Heartbeat scan failed for org=%s archetype=%s",
                cfg.org_id,
                cfg.archetype,
            )
            # Reset last run so it retries next tick
            _LAST_RUN.pop(key, None)
