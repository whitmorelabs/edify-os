"""FastAPI router for the /execute endpoint."""

from __future__ import annotations

import logging
import traceback

from fastapi import APIRouter, Request

from src.api.models import (
    ExecutionOutput,
    ExecutionRequest,
    ExecutionResult,
    ExecutionStatus,
)
from src.orchestrator.engine import OrchestrationEngine

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/execute", response_model=ExecutionResult)
async def execute_task(body: ExecutionRequest, request: Request) -> ExecutionResult:
    """Primary entry point called by the TypeScript API server.

    The TS API forwards the user's request along with the org's own
    Anthropic API key. We spin up an OrchestrationEngine scoped to that
    org and key, run the pipeline, and return the structured result.
    """
    db_pool = request.app.state.db_pool  # may be None in dev

    engine = OrchestrationEngine(
        org_id=body.org_id,
        anthropic_api_key=body.anthropic_api_key,
        db_pool=db_pool,
    )

    try:
        result = await engine.execute(
            agent_role=body.agent_role,
            user_message=body.input.user_message,
            conversation_id=body.input.conversation_id,
            context=body.input.context,
        )
        result.task_id = body.task_id
        return result

    except Exception as exc:
        logger.exception("Task %s failed: %s", body.task_id, exc)
        return ExecutionResult(
            task_id=body.task_id,
            status=ExecutionStatus.FAILED,
            output=ExecutionOutput(
                response="An internal error occurred while processing your request.",
                structured_data={},
                confidence_score=0.0,
            ),
            error=f"{type(exc).__name__}: {exc}\n{traceback.format_exc()}",
        )
