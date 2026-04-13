"""HeartbeatConfigManager -- stores and retrieves per-org heartbeat configs."""

from __future__ import annotations

import logging
from typing import Any

import asyncpg

from src.heartbeat.models import HeartbeatConfig, HeartbeatConfigUpdate, OrgHeartbeatSettings

logger = logging.getLogger(__name__)

# All valid archetype slugs in canonical order.
ALL_ARCHETYPES: list[str] = [
    "development_director",
    "marketing_director",
    "executive_assistant",
    "programs_director",
    "hr_volunteer_coordinator",
    "events_director",
]

# In-memory fallback: org_id -> {archetype -> HeartbeatConfig}
_IN_MEMORY_CONFIGS: dict[str, dict[str, HeartbeatConfig]] = {}


def _default_config(org_id: str, archetype: str) -> HeartbeatConfig:
    """Build a default HeartbeatConfig for an archetype."""
    return HeartbeatConfig(org_id=org_id, archetype=archetype)


class HeartbeatConfigManager:
    """Manage per-org heartbeat configurations.

    Parameters
    ----------
    db_pool : asyncpg.Pool | None
        Database pool. When *None*, uses an in-process dict as storage.
    """

    def __init__(self, db_pool: asyncpg.Pool | None) -> None:
        self._pool = db_pool

    async def get_org_config(self, org_id: str) -> OrgHeartbeatSettings:
        """Return heartbeat settings for all 6 archetypes.

        Creates defaults for any archetype that has no stored config.
        """
        if self._pool is not None:
            configs = await self._load_from_db(org_id)
        else:
            configs = self._load_from_memory(org_id)

        return OrgHeartbeatSettings(org_id=org_id, configs=configs)

    async def update_archetype_config(
        self,
        org_id: str,
        archetype: str,
        update: HeartbeatConfigUpdate,
    ) -> HeartbeatConfig:
        """Apply a partial update to one archetype's config and persist it.

        Parameters
        ----------
        org_id : str
            Target organisation.
        archetype : str
            Archetype slug to update.
        update : HeartbeatConfigUpdate
            Fields to change (None means keep existing).

        Returns
        -------
        HeartbeatConfig
            The updated config.
        """
        if self._pool is not None:
            existing = await self._fetch_one_from_db(org_id, archetype)
        else:
            existing = _IN_MEMORY_CONFIGS.get(org_id, {}).get(
                archetype, _default_config(org_id, archetype)
            )

        updated = existing.model_copy(
            update={k: v for k, v in update.model_dump().items() if v is not None}
        )

        if self._pool is not None:
            await self._upsert_to_db(updated)
        else:
            _IN_MEMORY_CONFIGS.setdefault(org_id, {})[archetype] = updated

        return updated

    async def toggle_all(self, org_id: str, enabled: bool) -> OrgHeartbeatSettings:
        """Enable or disable all heartbeats for an org in one call.

        Parameters
        ----------
        org_id : str
            Target organisation.
        enabled : bool
            New enabled state.

        Returns
        -------
        OrgHeartbeatSettings
            The updated settings.
        """
        update = HeartbeatConfigUpdate(enabled=enabled)
        for archetype in ALL_ARCHETYPES:
            await self.update_archetype_config(org_id, archetype, update)
        return await self.get_org_config(org_id)

    async def get_all_active_configs(self) -> list[HeartbeatConfig]:
        """Return every enabled HeartbeatConfig across all orgs.

        Used by the scheduler to know which scans to run.
        """
        if self._pool is not None:
            return await self._fetch_all_enabled_from_db()

        results: list[HeartbeatConfig] = []
        for org_configs in _IN_MEMORY_CONFIGS.values():
            for cfg in org_configs.values():
                if cfg.enabled:
                    results.append(cfg)
        return results

    # ------------------------------------------------------------------
    # DB helpers
    # ------------------------------------------------------------------

    async def _load_from_db(self, org_id: str) -> list[HeartbeatConfig]:
        """Load configs for all 6 archetypes, inserting defaults as needed."""
        configs: list[HeartbeatConfig] = []
        for archetype in ALL_ARCHETYPES:
            cfg = await self._fetch_one_from_db(org_id, archetype)
            configs.append(cfg)
        return configs

    async def _fetch_one_from_db(self, org_id: str, archetype: str) -> HeartbeatConfig:
        """Fetch one config row, returning a default if it doesn't exist."""
        default = _default_config(org_id, archetype)
        try:
            async with self._pool.acquire() as conn:  # type: ignore[union-attr]
                row = await conn.fetchrow(
                    """
                    SELECT * FROM heartbeat_configs
                    WHERE org_id = $1 AND archetype = $2
                    """,
                    org_id,
                    archetype,
                )
                if row is None:
                    await self._upsert_to_db(default)
                    return default
                return HeartbeatConfig(
                    org_id=row["org_id"],
                    archetype=row["archetype"],
                    enabled=row["enabled"],
                    frequency_hours=row["frequency_hours"],
                    active_start=row["active_start"],
                    active_end=row["active_end"],
                    timezone=row["timezone"],
                )
        except Exception:
            logger.warning(
                "Failed to fetch heartbeat config for org=%s archetype=%s.",
                org_id,
                archetype,
                exc_info=True,
            )
            return default

    async def _upsert_to_db(self, config: HeartbeatConfig) -> None:
        """Insert or update a heartbeat config row."""
        try:
            async with self._pool.acquire() as conn:  # type: ignore[union-attr]
                await conn.execute(
                    """
                    INSERT INTO heartbeat_configs
                        (org_id, archetype, enabled, frequency_hours,
                         active_start, active_end, timezone)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (org_id, archetype)
                    DO UPDATE SET
                        enabled = EXCLUDED.enabled,
                        frequency_hours = EXCLUDED.frequency_hours,
                        active_start = EXCLUDED.active_start,
                        active_end = EXCLUDED.active_end,
                        timezone = EXCLUDED.timezone
                    """,
                    config.org_id,
                    config.archetype,
                    config.enabled,
                    config.frequency_hours,
                    config.active_start,
                    config.active_end,
                    config.timezone,
                )
        except Exception:
            logger.warning("Failed to upsert heartbeat config to DB.", exc_info=True)

    async def _fetch_all_enabled_from_db(self) -> list[HeartbeatConfig]:
        """Fetch every enabled heartbeat config across all orgs."""
        try:
            async with self._pool.acquire() as conn:  # type: ignore[union-attr]
                rows = await conn.fetch(
                    "SELECT * FROM heartbeat_configs WHERE enabled = TRUE"
                )
                return [
                    HeartbeatConfig(
                        org_id=r["org_id"],
                        archetype=r["archetype"],
                        enabled=r["enabled"],
                        frequency_hours=r["frequency_hours"],
                        active_start=r["active_start"],
                        active_end=r["active_end"],
                        timezone=r["timezone"],
                    )
                    for r in rows
                ]
        except Exception:
            logger.warning("Failed to fetch all enabled heartbeat configs.", exc_info=True)
            return []

    # ------------------------------------------------------------------
    # In-memory helpers
    # ------------------------------------------------------------------

    def _load_from_memory(self, org_id: str) -> list[HeartbeatConfig]:
        """Return all 6 archetype configs from memory, creating defaults as needed."""
        if org_id not in _IN_MEMORY_CONFIGS:
            _IN_MEMORY_CONFIGS[org_id] = {}

        configs: list[HeartbeatConfig] = []
        for archetype in ALL_ARCHETYPES:
            if archetype not in _IN_MEMORY_CONFIGS[org_id]:
                _IN_MEMORY_CONFIGS[org_id][archetype] = _default_config(org_id, archetype)
            configs.append(_IN_MEMORY_CONFIGS[org_id][archetype])
        return configs
