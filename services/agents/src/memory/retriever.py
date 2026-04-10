"""Memory retriever -- searches the org's knowledge store.

Currently uses full-text search via Postgres ``to_tsvector`` / ``ts_rank``.
A pgvector-based semantic search path is stubbed out and can be enabled once
embeddings are stored alongside memory rows.
"""

from __future__ import annotations

import json
import logging
from typing import Any

import asyncpg

logger = logging.getLogger(__name__)


class MemoryRetriever:
    """Query organisational memory stored in Postgres/Supabase.

    Parameters
    ----------
    db_pool : asyncpg.Pool | None
        A connection pool. When *None* (local dev without DB), all queries
        return an empty list silently.
    org_id : str
        Scopes every query to this organisation.
    """

    def __init__(self, db_pool: asyncpg.Pool | None, org_id: str) -> None:
        self._pool = db_pool
        self._org_id = org_id

    async def retrieve(
        self,
        query: str,
        limit: int = 5,
    ) -> list[dict[str, Any]]:
        """Search org memory and return the top matches.

        Falls back gracefully when the database is unavailable.
        """
        if self._pool is None:
            logger.debug("No DB pool -- returning empty memory results.")
            return []

        try:
            return await self._text_search(query, limit)
        except Exception:
            logger.warning("Memory retrieval failed -- returning empty.", exc_info=True)
            return []

    async def save(
        self,
        title: str,
        content: str,
        category: str,
        tags: list[str] | None = None,
    ) -> str | None:
        """Persist a finding to org memory. Returns the new row id."""
        if self._pool is None:
            logger.debug("No DB pool -- skipping memory save.")
            return None

        try:
            async with self._pool.acquire() as conn:
                row = await conn.fetchrow(
                    """
                    INSERT INTO org_memory (org_id, title, content, category, tags)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING id
                    """,
                    self._org_id,
                    title,
                    content,
                    category,
                    tags or [],
                )
                return str(row["id"]) if row else None
        except Exception:
            logger.warning("Memory save failed.", exc_info=True)
            return None

    # ------------------------------------------------------------------
    # Internal search implementations
    # ------------------------------------------------------------------

    async def _text_search(
        self,
        query: str,
        limit: int,
    ) -> list[dict[str, Any]]:
        """Full-text search using Postgres tsvector."""
        async with self._pool.acquire() as conn:  # type: ignore[union-attr]
            rows = await conn.fetch(
                """
                SELECT
                    id,
                    title,
                    content,
                    category,
                    tags,
                    ts_rank(
                        to_tsvector('english', title || ' ' || content),
                        plainto_tsquery('english', $2)
                    ) AS rank
                FROM org_memory
                WHERE org_id = $1
                  AND to_tsvector('english', title || ' ' || content)
                      @@ plainto_tsquery('english', $2)
                ORDER BY rank DESC
                LIMIT $3
                """,
                self._org_id,
                query,
                limit,
            )
            return [
                {
                    "id": str(r["id"]),
                    "title": r["title"],
                    "content": r["content"],
                    "category": r["category"],
                    "tags": r["tags"],
                    "relevance": float(r["rank"]),
                }
                for r in rows
            ]

    # TODO: Enable once embeddings are stored alongside memory rows.
    async def _vector_search(
        self,
        query_embedding: list[float],
        limit: int,
    ) -> list[dict[str, Any]]:
        """Semantic search via pgvector cosine similarity."""
        async with self._pool.acquire() as conn:  # type: ignore[union-attr]
            rows = await conn.fetch(
                """
                SELECT
                    id, title, content, category, tags,
                    1 - (embedding <=> $2::vector) AS similarity
                FROM org_memory
                WHERE org_id = $1
                ORDER BY embedding <=> $2::vector
                LIMIT $3
                """,
                self._org_id,
                json.dumps(query_embedding),
                limit,
            )
            return [
                {
                    "id": str(r["id"]),
                    "title": r["title"],
                    "content": r["content"],
                    "category": r["category"],
                    "tags": r["tags"],
                    "similarity": float(r["similarity"]),
                }
                for r in rows
            ]
