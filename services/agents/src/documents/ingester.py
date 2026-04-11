"""Orchestrates the full document ingestion pipeline.

Flow:
  parse (DocumentParser) -> chunk (TextChunker) -> save (MemoryRetriever)

Optional: generate an LLM summary and save it as an extra memory entry.
"""

from __future__ import annotations

import logging
import uuid
from typing import TYPE_CHECKING

from src.documents.chunker import TextChunker
from src.documents.parser import DocumentParser
from src.memory.retriever import MemoryRetriever

if TYPE_CHECKING:
    from src.llm.base import BaseLLMClient

logger = logging.getLogger(__name__)

# In-memory fallback store used when no DB pool is available.
_IN_MEMORY_STORE: dict[str, dict] = {}

_SUMMARY_SYSTEM_PROMPT = (
    "You are a concise document analyst. "
    "Summarise the following document in exactly one paragraph (3–5 sentences). "
    "Focus on the core purpose, key facts, and why this document matters to the organisation. "
    "Do not use bullet points. Return only the paragraph text."
)


class DocumentIngester:
    """Orchestrate parsing, chunking, and memory storage for an uploaded file.

    Parameters
    ----------
    memory:
        A :class:`MemoryRetriever` scoped to the target organisation.
    org_id:
        Organisation identifier (used for in-memory fallback key).
    """

    def __init__(self, memory: MemoryRetriever, org_id: str) -> None:
        self._memory = memory
        self._org_id = org_id
        self._parser = DocumentParser()
        self._chunker = TextChunker()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def ingest(
        self,
        file_path: str,
        file_type: str,
        category: str,
        title: str,
    ) -> list[str]:
        """Parse, chunk, and store a document as memory entries.

        Parameters
        ----------
        file_path:
            Absolute path to the uploaded file.
        file_type:
            Lower-cased extension without dot (e.g. ``"pdf"``).
        category:
            Memory category slug (e.g. ``"grants"``, ``"mission"``).
        title:
            Human-readable document name used as the memory entry title.

        Returns
        -------
        list[str]
            IDs of every memory entry created.
        """
        text = self._parser.parse(file_path, file_type)
        chunks = self._chunker.chunk(text)

        entry_ids: list[str] = []
        total = len(chunks)

        for i, chunk in enumerate(chunks, start=1):
            chunk_title = title if total == 1 else f"{title} (part {i}/{total})"
            entry_id = await self._save_entry(
                title=chunk_title,
                content=chunk,
                category=category,
                tags=["uploaded_document", file_type],
            )
            if entry_id is not None:
                entry_ids.append(entry_id)

        logger.info(
            "Ingested '%s' (%s): %d chunk(s) stored for org=%s.",
            title,
            file_type,
            len(entry_ids),
            self._org_id,
        )
        return entry_ids

    async def ingest_with_summary(
        self,
        file_path: str,
        file_type: str,
        category: str,
        title: str,
        client: BaseLLMClient,
    ) -> list[str]:
        """Parse, chunk, store, *and* generate a one-paragraph LLM summary.

        The summary is stored as an additional memory entry tagged
        ``"document_summary"``, making it fast to retrieve a high-level
        overview without scanning every chunk.

        Parameters
        ----------
        file_path:
            Absolute path to the uploaded file.
        file_type:
            Lower-cased extension.
        category:
            Memory category slug.
        title:
            Human-readable document name.
        client:
            An instantiated :class:`BaseLLMClient` to use for summarisation.

        Returns
        -------
        list[str]
            IDs of all created memory entries (chunks + summary).
        """
        text = self._parser.parse(file_path, file_type)
        chunks = self._chunker.chunk(text)

        # Store chunks first
        entry_ids: list[str] = []
        total = len(chunks)

        for i, chunk in enumerate(chunks, start=1):
            chunk_title = title if total == 1 else f"{title} (part {i}/{total})"
            entry_id = await self._save_entry(
                title=chunk_title,
                content=chunk,
                category=category,
                tags=["uploaded_document", file_type],
            )
            if entry_id is not None:
                entry_ids.append(entry_id)

        # Generate summary from the full text (capped at the parsed limit)
        summary_text = await self._generate_summary(text, client)

        summary_id = await self._save_entry(
            title=f"{title} (summary)",
            content=summary_text,
            category=category,
            tags=["uploaded_document", file_type, "document_summary"],
        )
        if summary_id is not None:
            entry_ids.append(summary_id)

        logger.info(
            "Ingested '%s' (%s) with summary: %d total entries for org=%s.",
            title,
            file_type,
            len(entry_ids),
            self._org_id,
        )
        return entry_ids

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    async def _save_entry(
        self,
        title: str,
        content: str,
        category: str,
        tags: list[str],
    ) -> str | None:
        """Save to DB via MemoryRetriever, or fall back to in-memory store."""
        entry_id = await self._memory.save(
            title=title,
            content=content,
            category=category,
            tags=tags,
        )

        if entry_id is None:
            # DB unavailable -- use in-memory fallback (dev mode)
            fallback_id = str(uuid.uuid4())
            _IN_MEMORY_STORE[fallback_id] = {
                "id": fallback_id,
                "org_id": self._org_id,
                "title": title,
                "content": content,
                "category": category,
                "tags": tags,
            }
            logger.debug("In-memory fallback: stored entry '%s' as %s.", title, fallback_id)
            return fallback_id

        return entry_id

    async def _generate_summary(self, text: str, client: BaseLLMClient) -> str:
        """Ask the LLM to summarise *text* in one paragraph."""
        # Feed up to the first 8000 characters to keep the prompt lean
        excerpt = text[:8000]
        if len(text) > 8000:
            excerpt += "\n\n[... document continues ...]"

        try:
            response = await client.complete(
                system=_SUMMARY_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": excerpt}],
                max_tokens=512,
                temperature=0.2,
            )
            # Extract text from Anthropic-style response
            content_blocks = response.get("content", [])
            for block in content_blocks:
                if isinstance(block, dict) and block.get("type") == "text":
                    return block["text"].strip()
            # Fallback: stringify content
            return str(content_blocks)
        except Exception:
            logger.warning("Summary generation failed -- skipping.", exc_info=True)
            return f"[Summary unavailable] Document: {text[:500]}..."
