"""HeartbeatNotifier -- persists heartbeat results and serves history."""

from __future__ import annotations

import logging
from collections import deque
from typing import Any

import asyncpg

from src.heartbeat.models import HeartbeatResult

logger = logging.getLogger(__name__)

# In-memory fallback: stores the last 500 results per process.
_IN_MEMORY_LOG: deque[dict[str, Any]] = deque(maxlen=500)


class HeartbeatNotifier:
    """Deliver heartbeat results to storage and serve history queries.

    Parameters
    ----------
    db_pool : asyncpg.Pool | None
        Database pool. When *None*, falls back to an in-memory log.
    """

    def __init__(self, db_pool: asyncpg.Pool | None) -> None:
        self._pool = db_pool

    async def deliver(self, result: HeartbeatResult) -> bool:
        """Persist a heartbeat result.

        Parameters
        ----------
        result : HeartbeatResult
            The scan result to save.

        Returns
        -------
        bool
            True if the result was saved (not skipped), False if skipped.
        """
        if result.skipped:
            logger.debug(
                "Heartbeat skipped for org=%s archetype=%s reason=%s",
                result.org_id,
                result.archetype,
                result.skipped_reason,
            )
            return False

        logger.info(
            "Heartbeat delivering for org=%s archetype=%s title=%r",
            result.org_id,
            result.archetype,
            result.title,
        )

        if self._pool is not None:
            await self._save_to_db(result)
        else:
            _IN_MEMORY_LOG.appendleft(result.model_dump())

        return True

    async def get_history(
        self,
        org_id: str,
        archetype: str | None = None,
        limit: int = 20,
    ) -> list[HeartbeatResult]:
        """Return recent heartbeat results for an org.

        Parameters
        ----------
        org_id : str
            Filter to this organisation.
        archetype : str | None
            If provided, filter to this archetype slug only.
        limit : int
            Maximum number of results to return.

        Returns
        -------
        list[HeartbeatResult]
            Most recent results first.
        """
        if self._pool is not None:
            return await self._fetch_from_db(org_id, archetype, limit)

        # In-memory fallback
        results = []
        for row in _IN_MEMORY_LOG:
            if row.get("org_id") != org_id:
                continue
            if archetype is not None and row.get("archetype") != archetype:
                continue
            results.append(HeartbeatResult(**row))
            if len(results) >= limit:
                break
        return results

    # ------------------------------------------------------------------
    # DB helpers
    # ------------------------------------------------------------------

    async def _save_to_db(self, result: HeartbeatResult) -> None:
        """Persist a HeartbeatResult to the heartbeat_logs table."""
        try:
            async with self._pool.acquire() as conn:  # type: ignore[union-attr]
                await conn.execute(
                    """
                    INSERT INTO heartbeat_logs (
                        id, org_id, archetype, display_name,
                        title, body, suggested_action,
                        skipped, skipped_reason, created_at, token_usage
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    ON CONFLICT (id) DO NOTHING
                    """,
                    result.id,
                    result.org_id,
                    result.archetype,
                    result.display_name,
                    result.title,
                    result.body,
                    result.suggested_action,
                    result.skipped,
                    result.skipped_reason,
                    result.created_at,
                    result.token_usage,
                )
        except Exception:
            logger.warning(
                "Failed to save heartbeat result %s to DB -- falling back to in-memory.",
                result.id,
                exc_info=True,
            )
            _IN_MEMORY_LOG.appendleft(result.model_dump())

    async def _fetch_from_db(
        self,
        org_id: str,
        archetype: str | None,
        limit: int,
    ) -> list[HeartbeatResult]:
        """Fetch heartbeat history from DB."""
        try:
            async with self._pool.acquire() as conn:  # type: ignore[union-attr]
                if archetype is not None:
                    rows = await conn.fetch(
                        """
                        SELECT * FROM heartbeat_logs
                        WHERE org_id = $1 AND archetype = $2
                        ORDER BY created_at DESC
                        LIMIT $3
                        """,
                        org_id,
                        archetype,
                        limit,
                    )
                else:
                    rows = await conn.fetch(
                        """
                        SELECT * FROM heartbeat_logs
                        WHERE org_id = $1
                        ORDER BY created_at DESC
                        LIMIT $2
                        """,
                        org_id,
                        limit,
                    )
                return [
                    HeartbeatResult(
                        id=str(r["id"]),
                        org_id=r["org_id"],
                        archetype=r["archetype"],
                        display_name=r["display_name"],
                        title=r["title"],
                        body=r["body"],
                        suggested_action=r["suggested_action"],
                        skipped=r["skipped"],
                        skipped_reason=r["skipped_reason"],
                        created_at=str(r["created_at"]),
                        token_usage=r["token_usage"],
                    )
                    for r in rows
                ]
        except Exception:
            logger.warning("Failed to fetch heartbeat history from DB.", exc_info=True)
            return []
