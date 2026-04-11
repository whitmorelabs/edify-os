"""Pydantic models for the Decision Lab feature."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class ScenarioRequest(BaseModel):
    """Input payload for running a decision scenario."""

    scenario_text: str = Field(..., min_length=1, description="The decision or scenario to analyze.")
    selected_archetypes: list[str] | None = Field(
        None,
        description="Subset of archetype slugs to consult. Defaults to all 7 if omitted.",
    )
    org_id: str = Field(..., description="Organisation that owns this request.")
    anthropic_api_key: str = Field(
        ...,
        min_length=1,
        description="Per-org Anthropic API key (BYOK). Never stored.",
    )


class ArchetypeResponse(BaseModel):
    """A single archetype's analysis of the scenario."""

    role_slug: str = Field(..., description="Machine-readable archetype identifier.")
    display_name: str = Field(..., description="Human-readable archetype name.")
    stance: Literal["support", "caution", "oppose"] = Field(
        ..., description="The archetype's overall stance on the decision."
    )
    response_text: str = Field(..., description="Full analysis from this archetype's perspective.")
    confidence: Literal["low", "medium", "high"] = Field(
        ..., description="How confident the archetype is in its stance."
    )


class Synthesis(BaseModel):
    """Cross-archetype synthesis produced by the neutral facilitator."""

    consensus: list[str] = Field(
        default_factory=list,
        description="Points that most or all archetypes agree on.",
    )
    disagreements: list[str] = Field(
        default_factory=list,
        description="Key areas where archetypes diverge.",
    )
    top_risks: list[str] = Field(
        default_factory=list,
        description="Top 3 risks identified across all responses.",
    )
    recommended_action: str = Field(
        ..., description="Single recommended action based on the full analysis."
    )


class ScenarioResult(BaseModel):
    """Complete result for a Decision Lab run."""

    scenario_id: str = Field(..., description="Unique identifier for this scenario run.")
    scenario_text: str = Field(..., description="The original decision text.")
    responses: list[ArchetypeResponse] = Field(
        default_factory=list,
        description="Individual archetype analyses.",
    )
    synthesis: Synthesis = Field(..., description="Cross-archetype synthesis.")
    created_at: str = Field(..., description="ISO-8601 timestamp of when the scenario was run.")


class FollowUpRequest(BaseModel):
    """Input for drilling into a single archetype's response."""

    question: str = Field(..., min_length=1, description="The follow-up question.")
    archetype_slug: str = Field(..., description="Which archetype to consult.")
    anthropic_api_key: str = Field(
        ...,
        min_length=1,
        description="Per-org Anthropic API key (BYOK). Never stored.",
    )
