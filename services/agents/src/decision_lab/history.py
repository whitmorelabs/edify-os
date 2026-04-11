"""Scenario history storage for Decision Lab.

Persists completed ScenarioResult objects to Postgres when a DB pool
is available, and falls back to an in-memory dict for local dev.
"""

from __future__ import annotations

import json
import logging
from typing import Any

import asyncpg

from src.decision_lab.models import ScenarioResult

logger = logging.getLogger(__name__)

# In-memory fallback store (shared across instances in a single process)
_IN_MEMORY_STORE: dict[str, dict[str, Any]] = {}


class ScenarioHistory:
    """Persist and retrieve Decision Lab scenario results.

    Parameters
    ----------
    db_pool : asyncpg.Pool | None
        When None, uses an in-process dict as fallback.
    org_id : str
        Scopes all operations to this organisation.
    """

    def __init__(self, db_pool: asyncpg.Pool | None, org_id: str) -> None:
        self._pool = db_pool
        self._org_id = org_id

    async def save(self, result: ScenarioResult) -> str:
        """Persist a scenario result and return its scenario_id.

        Parameters
        ----------
        result : ScenarioResult
            The completed scenario to store.

        Returns
        -------
        str
            The scenario_id.
        """
        if self._pool is not None:
            return await self._db_save(result)
        return self._memory_save(result)

    async def list_scenarios(self, limit: int = 20) -> list[dict[str, Any]]:
        """Return a summary list of recent scenarios for this org.

        Each entry contains: scenario_id, scenario_text (preview), created_at.
        """
        if self._pool is not None:
            return await self._db_list(limit)
        return self._memory_list(limit)

    async def get_scenario(self, scenario_id: str) -> ScenarioResult | None:
        """Fetch a full ScenarioResult by ID, or None if not found."""
        if self._pool is not None:
            return await self._db_get(scenario_id)
        return self._memory_get(scenario_id)

    # ------------------------------------------------------------------
    # DB-backed implementations
    # ------------------------------------------------------------------

    async def _db_save(self, result: ScenarioResult) -> str:
        """Insert the scenario into the decision_lab_scenarios table."""
        data = result.model_dump()
        try:
            async with self._pool.acquire() as conn:  # type: ignore[union-attr]
                await conn.execute(
                    """
                    INSERT INTO decision_lab_scenarios
                        (scenario_id, org_id, scenario_text, result_json, created_at)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (scenario_id) DO NOTHING
                    """,
                    result.scenario_id,
                    self._org_id,
                    result.scenario_text,
                    json.dumps(data),
                    result.created_at,
                )
        except Exception:
            logger.warning(
                "DB save failed for scenario %s -- falling back to memory.",
                result.scenario_id,
                exc_info=True,
            )
            self._memory_save(result)

        return result.scenario_id

    async def _db_list(self, limit: int) -> list[dict[str, Any]]:
        """List recent scenarios from the database."""
        try:
            async with self._pool.acquire() as conn:  # type: ignore[union-attr]
                rows = await conn.fetch(
                    """
                    SELECT scenario_id, scenario_text, created_at
                    FROM decision_lab_scenarios
                    WHERE org_id = $1
                    ORDER BY created_at DESC
                    LIMIT $2
                    """,
                    self._org_id,
                    limit,
                )
                return [
                    {
                        "scenario_id": r["scenario_id"],
                        "scenario_text_preview": r["scenario_text"][:200],
                        "created_at": r["created_at"],
                    }
                    for r in rows
                ]
        except Exception:
            logger.warning("DB list failed -- falling back to memory.", exc_info=True)
            return self._memory_list(limit)

    async def _db_get(self, scenario_id: str) -> ScenarioResult | None:
        """Fetch a full scenario from the database."""
        try:
            async with self._pool.acquire() as conn:  # type: ignore[union-attr]
                row = await conn.fetchrow(
                    """
                    SELECT result_json FROM decision_lab_scenarios
                    WHERE scenario_id = $1 AND org_id = $2
                    """,
                    scenario_id,
                    self._org_id,
                )
                if row is None:
                    return None
                data = json.loads(row["result_json"])
                return ScenarioResult.model_validate(data)
        except Exception:
            logger.warning(
                "DB get failed for %s -- falling back to memory.", scenario_id, exc_info=True
            )
            return self._memory_get(scenario_id)

    # ------------------------------------------------------------------
    # In-memory fallback implementations
    # ------------------------------------------------------------------

    def _memory_save(self, result: ScenarioResult) -> str:
        key = f"{self._org_id}:{result.scenario_id}"
        _IN_MEMORY_STORE[key] = result.model_dump()
        logger.debug("Saved scenario %s to in-memory store.", result.scenario_id)
        return result.scenario_id

    def _memory_list(self, limit: int) -> list[dict[str, Any]]:
        prefix = f"{self._org_id}:"
        org_entries = [
            v for k, v in _IN_MEMORY_STORE.items() if k.startswith(prefix)
        ]
        # Sort by created_at descending
        org_entries.sort(key=lambda e: e.get("created_at", ""), reverse=True)
        return [
            {
                "scenario_id": e["scenario_id"],
                "scenario_text_preview": e["scenario_text"][:200],
                "created_at": e["created_at"],
            }
            for e in org_entries[:limit]
        ]

    def _memory_get(self, scenario_id: str) -> ScenarioResult | None:
        key = f"{self._org_id}:{scenario_id}"
        data = _IN_MEMORY_STORE.get(key)
        if data is None:
            return None
        return ScenarioResult.model_validate(data)
