"""Pydantic models for the proactive heartbeat system."""

from __future__ import annotations

from pydantic import BaseModel, Field


class HeartbeatConfig(BaseModel):
    """Per-archetype heartbeat configuration for an org."""

    org_id: str = Field(..., description="Organisation that owns this config.")
    archetype: str = Field(..., description="Archetype slug, e.g. 'development_director'.")
    enabled: bool = Field(True, description="Whether this heartbeat is active.")
    frequency_hours: int = Field(
        4, ge=1, le=168, description="How often to scan, in hours."
    )
    active_start: int = Field(
        8, ge=0, le=23, description="Hour (0-23) when heartbeats may fire. Inclusive."
    )
    active_end: int = Field(
        20, ge=0, le=23, description="Hour (0-23) when heartbeats stop. Inclusive."
    )
    timezone: str = Field(
        "America/New_York",
        description="IANA timezone for active_start / active_end evaluation.",
    )


class HeartbeatResult(BaseModel):
    """The outcome of a single archetype scan."""

    id: str = Field(..., description="Unique ID for this heartbeat result.")
    org_id: str = Field(..., description="Organisation the scan ran for.")
    archetype: str = Field(..., description="Archetype slug.")
    display_name: str = Field(..., description="Human-readable archetype name.")
    title: str = Field(..., description="One-line summary of the finding.")
    body: str = Field(..., description="2-3 sentence context for the finding.")
    suggested_action: str | None = Field(
        None, description="Suggested next step, if any."
    )
    skipped: bool = Field(
        False, description="True when the scan found nothing noteworthy."
    )
    skipped_reason: str | None = Field(
        None, description="Why the scan was skipped, if applicable."
    )
    created_at: str = Field(..., description="ISO-8601 UTC timestamp.")
    token_usage: int = Field(0, description="Tokens consumed by this scan.")


class HeartbeatConfigUpdate(BaseModel):
    """Partial update payload for a single archetype's heartbeat config."""

    enabled: bool | None = None
    frequency_hours: int | None = Field(None, ge=1, le=168)
    active_start: int | None = Field(None, ge=0, le=23)
    active_end: int | None = Field(None, ge=0, le=23)
    timezone: str | None = None


class OrgHeartbeatSettings(BaseModel):
    """All heartbeat configs for an org, plus org-level settings."""

    org_id: str = Field(..., description="Organisation identifier.")
    configs: list[HeartbeatConfig] = Field(
        default_factory=list,
        description="One HeartbeatConfig per archetype.",
    )
    email_digest: bool = Field(
        False, description="Whether to send a daily email digest (future feature)."
    )
    digest_time: int = Field(
        8, ge=0, le=23, description="Hour (org timezone) to send the digest."
    )
