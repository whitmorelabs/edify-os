"""Pydantic models for the agent execution API."""

from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------


class ExecutionInput(BaseModel):
    """Payload describing what the user wants done."""

    user_message: str = Field(..., min_length=1, description="The user's natural-language request.")
    conversation_id: str | None = Field(
        None, description="Existing conversation thread to continue."
    )
    context: dict[str, Any] = Field(
        default_factory=dict,
        description="Arbitrary org/user context forwarded from the TS API.",
    )


class ExecutionRequest(BaseModel):
    """Top-level request sent by the TypeScript API server."""

    task_id: str = Field(..., description="Unique task identifier assigned by the TS API.")
    org_id: str = Field(..., description="Organisation that owns this request.")
    agent_role: str = Field(
        ..., description="Primary agent role slug, e.g. 'executive_assistant'."
    )
    input: ExecutionInput
    anthropic_api_key: str = Field(
        ...,
        min_length=1,
        description="Per-org Anthropic API key (BYOK). Never stored.",
    )


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------


class ExecutionStatus(str, Enum):
    COMPLETED = "completed"
    AWAITING_APPROVAL = "awaiting_approval"
    FAILED = "failed"


class ApprovalItem(BaseModel):
    """Describes an action that needs human sign-off before executing."""

    action: str
    description: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class ExecutionOutput(BaseModel):
    response: str = Field(..., description="Human-readable response to the user.")
    structured_data: dict[str, Any] = Field(
        default_factory=dict,
        description="Machine-readable payload (e.g. calendar events, draft emails).",
    )
    confidence_score: float = Field(
        0.0, ge=0.0, le=1.0, description="Confidence in the output quality."
    )


class ExecutionResult(BaseModel):
    """Final result returned to the TypeScript API server."""

    task_id: str
    status: ExecutionStatus
    output: ExecutionOutput
    approval_needed: list[ApprovalItem] | None = None
    error: str | None = None


# ---------------------------------------------------------------------------
# Internal planning models
# ---------------------------------------------------------------------------


class SubtaskPlan(BaseModel):
    """A single step in an orchestrated plan."""

    subagent: str = Field(..., description="Subagent role slug to execute this step.")
    task_description: str = Field(..., description="What this step should accomplish.")
    depends_on: list[str] = Field(
        default_factory=list, description="Names of subtasks that must finish first."
    )
    priority: int = Field(1, ge=1, le=5, description="1 = highest priority.")
