"""FastAPI router for the Decision Lab feature."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, HTTPException, Request

from src.claude.client import ClaudeClient
from src.decision_lab.history import ScenarioHistory
from src.decision_lab.models import (
    ArchetypeResponse,
    FollowUpRequest,
    ScenarioRequest,
    ScenarioResult,
)
from src.decision_lab.orchestrator import DecisionLabOrchestrator
from src.memory.retriever import MemoryRetriever

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/decision-lab", tags=["decision-lab"])


def _make_orchestrator(
    request: Request,
    org_id: str,
    anthropic_api_key: str,
) -> tuple[DecisionLabOrchestrator, ScenarioHistory]:
    """Build an orchestrator and history store scoped to this request's org."""
    db_pool = request.app.state.db_pool  # may be None in dev

    client = ClaudeClient(api_key=anthropic_api_key)
    memory = MemoryRetriever(db_pool=db_pool, org_id=org_id)
    orchestrator = DecisionLabOrchestrator(
        client=client,
        memory=memory,
        org_id=org_id,
    )
    history = ScenarioHistory(db_pool=db_pool, org_id=org_id)
    return orchestrator, history


@router.post("/run", response_model=ScenarioResult)
async def run_scenario(body: ScenarioRequest, request: Request) -> ScenarioResult:
    """Run a decision scenario through all (or selected) AI archetypes.

    Dispatches the scenario to each archetype in parallel, synthesizes the
    responses, persists the result, and returns the full ScenarioResult.
    """
    orchestrator, history = _make_orchestrator(
        request, body.org_id, body.anthropic_api_key
    )

    try:
        context: dict[str, Any] = {}  # org context can be forwarded here in future

        result = await orchestrator.run_scenario(
            scenario_text=body.scenario_text,
            selected_archetypes=body.selected_archetypes,
            context=context,
        )
    except Exception as exc:
        logger.exception("Decision Lab run failed: %s", exc)
        raise HTTPException(
            status_code=500,
            detail=f"Decision Lab run failed: {type(exc).__name__}: {exc}",
        ) from exc
    finally:
        await orchestrator.close()

    try:
        await history.save(result)
    except Exception:
        logger.warning("Failed to persist scenario %s -- result still returned.", result.scenario_id, exc_info=True)

    return result


@router.get("/history", response_model=list[dict])
async def list_history(request: Request, org_id: str, limit: int = 20) -> list[dict]:
    """Return a list of recent Decision Lab scenarios for the org.

    Each entry contains: scenario_id, scenario_text_preview, created_at.
    """
    db_pool = request.app.state.db_pool
    history = ScenarioHistory(db_pool=db_pool, org_id=org_id)

    try:
        return await history.list_scenarios(limit=limit)
    except Exception as exc:
        logger.exception("Failed to list scenarios: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to retrieve scenario history.") from exc


@router.get("/{scenario_id}", response_model=ScenarioResult)
async def get_scenario(
    scenario_id: str, request: Request, org_id: str
) -> ScenarioResult:
    """Fetch the full result for a specific Decision Lab scenario."""
    db_pool = request.app.state.db_pool
    history = ScenarioHistory(db_pool=db_pool, org_id=org_id)

    try:
        result = await history.get_scenario(scenario_id)
    except Exception as exc:
        logger.exception("Failed to fetch scenario %s: %s", scenario_id, exc)
        raise HTTPException(status_code=500, detail="Failed to retrieve scenario.") from exc

    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"Scenario '{scenario_id}' not found for this organisation.",
        )

    return result


@router.post("/{scenario_id}/follow-up", response_model=ArchetypeResponse)
async def follow_up(
    scenario_id: str,
    body: FollowUpRequest,
    request: Request,
    org_id: str,
) -> ArchetypeResponse:
    """Drill into a single archetype's analysis with a follow-up question.

    Fetches the original scenario and the target archetype's response,
    then re-queries just that archetype with the follow-up in context.
    """
    db_pool = request.app.state.db_pool
    history = ScenarioHistory(db_pool=db_pool, org_id=org_id)

    # Fetch the original scenario
    try:
        original = await history.get_scenario(scenario_id)
    except Exception as exc:
        logger.exception("Failed to fetch scenario %s for follow-up: %s", scenario_id, exc)
        raise HTTPException(status_code=500, detail="Failed to retrieve scenario.") from exc

    if original is None:
        raise HTTPException(
            status_code=404,
            detail=f"Scenario '{scenario_id}' not found for this organisation.",
        )

    # Find the target archetype's original response
    target_response = next(
        (r for r in original.responses if r.role_slug == body.archetype_slug),
        None,
    )
    if target_response is None:
        raise HTTPException(
            status_code=404,
            detail=f"Archetype '{body.archetype_slug}' did not respond to scenario '{scenario_id}'.",
        )

    orchestrator, _ = _make_orchestrator(request, org_id, body.anthropic_api_key)

    try:
        follow_up_response = await orchestrator.run_follow_up(
            scenario_text=original.scenario_text,
            original_response=target_response,
            follow_up_question=body.question,
            context={},
        )
    except Exception as exc:
        logger.exception("Follow-up failed for %s/%s: %s", scenario_id, body.archetype_slug, exc)
        raise HTTPException(
            status_code=500,
            detail=f"Follow-up failed: {type(exc).__name__}: {exc}",
        ) from exc
    finally:
        await orchestrator.close()

    return follow_up_response
