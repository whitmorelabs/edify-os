"""FastAPI router for the heartbeat system."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Query, Request

from src.heartbeat.config import HeartbeatConfigManager
from src.llm import LLMClientFactory
from src.heartbeat.executor import HeartbeatExecutor
from src.heartbeat.models import (
    HeartbeatConfig,
    HeartbeatConfigUpdate,
    HeartbeatResult,
    OrgHeartbeatSettings,
)
from src.heartbeat.notifier import HeartbeatNotifier
from src.memory.retriever import MemoryRetriever

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/heartbeat", tags=["heartbeat"])


# ---------------------------------------------------------------------------
# Helper: build per-request dependencies
# ---------------------------------------------------------------------------


def _make_config_manager(request: Request) -> HeartbeatConfigManager:
    return HeartbeatConfigManager(db_pool=request.app.state.db_pool)


def _make_notifier(request: Request) -> HeartbeatNotifier:
    return HeartbeatNotifier(db_pool=request.app.state.db_pool)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.get("/config", response_model=OrgHeartbeatSettings)
async def get_heartbeat_config(
    request: Request,
    org_id: str = Query(..., description="Organisation identifier."),
) -> OrgHeartbeatSettings:
    """Return heartbeat configuration for all 7 archetypes for the org.

    Creates default configs for archetypes that have never been configured.
    """
    manager = _make_config_manager(request)
    try:
        return await manager.get_org_config(org_id)
    except Exception as exc:
        logger.exception("Failed to load heartbeat config for org=%s: %s", org_id, exc)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load heartbeat config: {type(exc).__name__}: {exc}",
        ) from exc


@router.patch("/config/{archetype}", response_model=HeartbeatConfig)
async def update_archetype_config(
    archetype: str,
    body: HeartbeatConfigUpdate,
    request: Request,
    org_id: str = Query(..., description="Organisation identifier."),
) -> HeartbeatConfig:
    """Update one archetype's heartbeat configuration.

    Only the fields provided in the request body are changed; omitted fields
    retain their current values.
    """
    manager = _make_config_manager(request)
    try:
        return await manager.update_archetype_config(org_id, archetype, body)
    except Exception as exc:
        logger.exception(
            "Failed to update heartbeat config for org=%s archetype=%s: %s",
            org_id,
            archetype,
            exc,
        )
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update config: {type(exc).__name__}: {exc}",
        ) from exc


@router.post("/config/toggle-all", response_model=OrgHeartbeatSettings)
async def toggle_all_heartbeats(
    request: Request,
    org_id: str = Query(..., description="Organisation identifier."),
    enabled: bool = Query(..., description="True to enable all, False to disable all."),
) -> OrgHeartbeatSettings:
    """Enable or disable all 7 archetype heartbeats for an org in one call."""
    manager = _make_config_manager(request)
    try:
        return await manager.toggle_all(org_id, enabled)
    except Exception as exc:
        logger.exception("Failed to toggle heartbeats for org=%s: %s", org_id, exc)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to toggle heartbeats: {type(exc).__name__}: {exc}",
        ) from exc


@router.get("/history", response_model=list[HeartbeatResult])
async def get_heartbeat_history(
    request: Request,
    org_id: str = Query(..., description="Organisation identifier."),
    archetype: str | None = Query(None, description="Filter to a single archetype slug."),
    limit: int = Query(20, ge=1, le=100, description="Max results to return."),
) -> list[HeartbeatResult]:
    """Return recent heartbeat results for an org.

    Optionally filter by archetype slug using the ``?archetype=`` query param.
    """
    notifier = _make_notifier(request)
    try:
        return await notifier.get_history(org_id=org_id, archetype=archetype, limit=limit)
    except Exception as exc:
        logger.exception("Failed to fetch heartbeat history for org=%s: %s", org_id, exc)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch history: {type(exc).__name__}: {exc}",
        ) from exc


@router.post("/trigger/{archetype}", response_model=HeartbeatResult)
async def trigger_heartbeat(
    archetype: str,
    request: Request,
    org_id: str = Query(..., description="Organisation identifier."),
    org_name: str = Query("My Organization", description="Display name of the organisation."),
    org_mission: str = Query("", description="One-line mission statement for memory search."),
    anthropic_api_key: str = Query(..., description="Per-org Anthropic API key (BYOK). Never stored."),
) -> HeartbeatResult:
    """Manually trigger a single archetype heartbeat scan.

    This endpoint is intended for development and testing. It runs a scan
    immediately, delivers the result, and returns it to the caller.
    """
    db_pool = request.app.state.db_pool

    client = LLMClientFactory.create(provider="anthropic", api_key=anthropic_api_key)
    memory = MemoryRetriever(db_pool=db_pool, org_id=org_id)
    executor = HeartbeatExecutor(client=client, memory=memory, org_id=org_id)
    notifier = _make_notifier(request)

    try:
        result = await executor.run_scan(
            archetype=archetype,
            org_name=org_name,
            org_mission=org_mission,
        )
    except Exception as exc:
        logger.exception(
            "Manual heartbeat trigger failed for org=%s archetype=%s: %s",
            org_id,
            archetype,
            exc,
        )
        raise HTTPException(
            status_code=500,
            detail=f"Heartbeat scan failed: {type(exc).__name__}: {exc}",
        ) from exc
    finally:
        await client.close()

    try:
        await notifier.deliver(result)
    except Exception:
        logger.warning(
            "Failed to deliver manual heartbeat result %s -- returning anyway.",
            result.id,
            exc_info=True,
        )

    return result
