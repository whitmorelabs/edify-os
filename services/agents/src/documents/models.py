# Pydantic models for the document upload pipeline.

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

CategorySlug = Literal[
    "mission",
    "programs",
    "donors",
    "grants",
    "campaigns",
    "brand_voice",
    "contacts",
    "processes",
    "general",
    "financials",
    "volunteers",
    "events",
]


class UploadRequest(BaseModel):
    """Metadata submitted alongside a file upload."""

    category: CategorySlug = Field(
        "general",
        description="Document category slug.",
    )
    title: str = Field(..., min_length=1, description="Human-readable document title.")
    org_id: str = Field(..., description="Organisation that owns this document.")
    anthropic_api_key: str = Field(
        "",
        description="Per-org Anthropic API key (BYOK). Never stored. Required only when generate_summary=true.",
    )
    generate_summary: bool = Field(
        False,
        description="When true, an LLM summary is generated and saved as an extra memory entry.",
    )


class UploadResult(BaseModel):
    """Result returned after a successful document ingestion."""

    memory_entry_ids: list[str] = Field(
        default_factory=list,
        description="IDs of all memory entries created (one per chunk, plus optional summary).",
    )
    chunks_created: int = Field(..., description="Number of text chunks stored.")
    summary_generated: bool = Field(..., description="Whether an LLM summary was created.")


class DocumentStatus(BaseModel):
    """Status report for an async ingestion job."""

    status: Literal["processing", "completed", "failed"] = Field(
        ..., description="Current state of the ingestion job."
    )
    chunks_created: int = Field(0, description="Chunks stored so far.")
    error: str | None = Field(None, description="Error message if status is 'failed'.")
