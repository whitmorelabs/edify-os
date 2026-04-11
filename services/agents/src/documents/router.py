"""FastAPI router for document upload and ingestion."""

from __future__ import annotations

import logging
import os
import tempfile
from typing import Any

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile

from src.documents.ingester import DocumentIngester, _IN_MEMORY_STORE
from src.documents.models import DocumentStatus, UploadResult
from src.llm import LLMClientFactory
from src.memory.retriever import MemoryRetriever

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["documents"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

ALLOWED_EXTENSIONS = {"pdf", "doc", "docx", "txt", "md", "csv", "xls", "xlsx"}

# Valid memory category slugs (mirrors 00008_expand_memory_categories.sql)
VALID_CATEGORIES = {
    "mission", "programs", "donors", "grants", "campaigns",
    "brand_voice", "contacts", "processes", "general",
    "financials", "volunteers", "events",
}

# Lightweight in-memory job tracker for async status polling
_JOB_STORE: dict[str, dict[str, Any]] = {}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _ext(filename: str) -> str:
    """Return lower-cased extension without the dot."""
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


def _resolve_category(raw: str) -> str:
    """Map frontend category labels to valid DB slugs, default to 'general'."""
    # Frontend may send plain slugs already validated by the TS route,
    # or the raw document-type key from the category map.
    FRONTEND_MAP = {
        "strategic_plan": "mission",
        "grant_proposal": "grants",
        "donor_list": "donors",
        "financial_statement": "financials",
        "program_description": "programs",
        "marketing_materials": "campaigns",
        "event_plan": "events",
        "staff_roster": "volunteers",
        "board_documents": "general",
        "other": "general",
    }
    resolved = FRONTEND_MAP.get(raw, raw)
    return resolved if resolved in VALID_CATEGORIES else "general"


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.post("/upload", response_model=UploadResult)
async def upload_document(
    request: Request,
    file: UploadFile = File(..., description="Document file to ingest."),
    category: str = Form("general", description="Document category slug."),
    title: str = Form(..., description="Human-readable document title."),
    org_id: str = Form(..., description="Organisation identifier."),
    anthropic_api_key: str = Form(
        "",
        description="Per-org Anthropic API key. Required only when generate_summary=true.",
    ),
    generate_summary: bool = Form(
        False, description="Generate an LLM summary entry in addition to chunks."
    ),
) -> UploadResult:
    """Accept a multipart file upload, parse it, and store it as memory entries.

    Supports: PDF, DOCX, DOC, TXT, MD, CSV, XLS, XLSX (max 10 MB).
    """
    # --- Validate file type ---
    ext = _ext(file.filename or "")
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=f"File type '.{ext}' is not supported. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    # --- Read and size-check ---
    data = await file.read()
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds the 10 MB limit ({len(data) // 1024} KB received).",
        )

    resolved_category = _resolve_category(category)
    db_pool = request.app.state.db_pool
    memory = MemoryRetriever(db_pool=db_pool, org_id=org_id)
    ingester = DocumentIngester(memory=memory, org_id=org_id)

    # Write to a temp file so parsers can use file-path APIs
    suffix = f".{ext}"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(data)
        tmp_path = tmp.name

    try:
        if generate_summary and anthropic_api_key:
            client = LLMClientFactory.create(
                provider="anthropic", api_key=anthropic_api_key
            )
            try:
                entry_ids = await ingester.ingest_with_summary(
                    file_path=tmp_path,
                    file_type=ext,
                    category=resolved_category,
                    title=title,
                    client=client,
                )
            finally:
                await client.close()
        else:
            entry_ids = await ingester.ingest(
                file_path=tmp_path,
                file_type=ext,
                category=resolved_category,
                title=title,
            )
    except (ValueError, RuntimeError) as exc:
        logger.warning("Document ingestion failed for org=%s: %s", org_id, exc)
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected error ingesting document for org=%s", org_id)
        raise HTTPException(
            status_code=500,
            detail=f"Ingestion failed unexpectedly: {type(exc).__name__}: {exc}",
        ) from exc
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass

    # Determine if summary was included (last entry tagged document_summary)
    summary_generated = generate_summary and anthropic_api_key != ""
    # Chunk count excludes the optional summary entry
    chunks_created = len(entry_ids) - 1 if summary_generated and len(entry_ids) > 0 else len(entry_ids)

    return UploadResult(
        memory_entry_ids=entry_ids,
        chunks_created=chunks_created,
        summary_generated=summary_generated and len(entry_ids) > 0,
    )


@router.get("/status/{job_id}", response_model=DocumentStatus)
async def get_ingestion_status(job_id: str) -> DocumentStatus:
    """Return the status of an async ingestion job.

    Note: the current upload endpoint is synchronous, so all completed
    uploads will always return 'completed'.  This endpoint exists to
    support future async / background ingestion (e.g. for very large files).
    """
    job = _JOB_STORE.get(job_id)
    if job is None:
        raise HTTPException(
            status_code=404,
            detail=f"Job '{job_id}' not found. It may have already been cleaned up.",
        )
    return DocumentStatus(
        status=job["status"],
        chunks_created=job.get("chunks_created", 0),
        error=job.get("error"),
    )


@router.delete("/{memory_entry_id}", status_code=204)
async def delete_document_entry(
    memory_entry_id: str,
    request: Request,
    org_id: str,
) -> None:
    """Delete a single memory entry by ID.

    Removes the entry from Postgres (if DB is available) or from the
    in-memory fallback store in dev mode.
    """
    db_pool = request.app.state.db_pool

    if db_pool is not None:
        try:
            async with db_pool.acquire() as conn:
                result = await conn.execute(
                    "DELETE FROM org_memory WHERE id = $1 AND org_id = $2",
                    memory_entry_id,
                    org_id,
                )
                if result == "DELETE 0":
                    raise HTTPException(
                        status_code=404,
                        detail=f"Memory entry '{memory_entry_id}' not found for this organisation.",
                    )
        except HTTPException:
            raise
        except Exception as exc:
            logger.exception("Failed to delete memory entry %s", memory_entry_id)
            raise HTTPException(
                status_code=500,
                detail=f"Delete failed: {type(exc).__name__}: {exc}",
            ) from exc
    else:
        # In-memory fallback (dev mode)
        if memory_entry_id in _IN_MEMORY_STORE:
            del _IN_MEMORY_STORE[memory_entry_id]
        else:
            raise HTTPException(
                status_code=404,
                detail=f"Memory entry '{memory_entry_id}' not found.",
            )
