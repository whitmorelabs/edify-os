"""Split large documents into memory-sized chunks.

Chunks are split on paragraph boundaries when possible, then sentence
boundaries, and finally by character count as a last resort.  A configurable
overlap ensures context is not lost at boundaries.
"""

from __future__ import annotations

import logging
import re

logger = logging.getLogger(__name__)


class TextChunker:
    """Break a long text into overlapping, self-contained chunks.

    Usage::

        chunker = TextChunker()
        chunks = chunker.chunk(text, chunk_size=1000, overlap=100)
    """

    def chunk(
        self,
        text: str,
        chunk_size: int = 1000,
        overlap: int = 100,
    ) -> list[str]:
        """Split *text* into chunks of approximately *chunk_size* characters.

        Parameters
        ----------
        text:
            The full document text to split.
        chunk_size:
            Target maximum number of characters per chunk.
        overlap:
            Number of characters from the end of a chunk to prepend to the
            next chunk, so context is preserved across boundaries.

        Returns
        -------
        list[str]
            List of non-empty text chunks.  Single documents that fit within
            *chunk_size* are returned as a one-element list.
        """
        text = text.strip()
        if not text:
            return []

        # Fast path: document fits in one chunk
        if len(text) <= chunk_size:
            return [text]

        # Try paragraph-level splitting first
        paragraphs = self._split_paragraphs(text)
        if len(paragraphs) > 1:
            chunks = self._assemble_chunks(paragraphs, chunk_size, overlap)
            if chunks:
                return chunks

        # Fall back to sentence-level splitting
        sentences = self._split_sentences(text)
        if len(sentences) > 1:
            chunks = self._assemble_chunks(sentences, chunk_size, overlap)
            if chunks:
                return chunks

        # Last resort: hard character split
        return self._hard_split(text, chunk_size, overlap)

    # ------------------------------------------------------------------
    # Splitting helpers
    # ------------------------------------------------------------------

    def _split_paragraphs(self, text: str) -> list[str]:
        """Split on one or more blank lines."""
        parts = re.split(r"\n\s*\n", text)
        return [p.strip() for p in parts if p.strip()]

    def _split_sentences(self, text: str) -> list[str]:
        """Rough sentence split on '. ', '! ', '? '."""
        # Keep the delimiter attached to the preceding sentence
        parts = re.split(r"(?<=[.!?])\s+", text)
        return [p.strip() for p in parts if p.strip()]

    # ------------------------------------------------------------------
    # Assembly
    # ------------------------------------------------------------------

    def _assemble_chunks(
        self,
        segments: list[str],
        chunk_size: int,
        overlap: int,
    ) -> list[str]:
        """Greedily pack *segments* into chunks no larger than *chunk_size*.

        When a single segment exceeds *chunk_size* on its own, it is included
        as its own chunk (hard limit is not enforced here -- the parser already
        caps the document at 100 K characters, so individual paragraphs are
        unlikely to be enormous).

        Overlap is implemented by back-tracking: after closing a chunk, the
        next chunk starts with up to *overlap* characters from the end of the
        previous chunk.
        """
        chunks: list[str] = []
        current_parts: list[str] = []
        current_len = 0
        overlap_text = ""

        for seg in segments:
            seg_len = len(seg)

            if current_len + seg_len + (1 if current_parts else 0) > chunk_size and current_parts:
                # Close the current chunk
                chunk = "\n\n".join(current_parts)
                chunks.append(chunk)
                # Compute overlap tail for next chunk
                overlap_text = chunk[-overlap:] if overlap and len(chunk) > overlap else ""
                current_parts = []
                current_len = 0

                if overlap_text:
                    current_parts.append(overlap_text)
                    current_len = len(overlap_text)

            current_parts.append(seg)
            current_len += seg_len + (2 if len(current_parts) > 1 else 0)  # "\n\n" separator

        if current_parts:
            chunks.append("\n\n".join(current_parts))

        return [c for c in chunks if c.strip()]

    def _hard_split(self, text: str, chunk_size: int, overlap: int) -> list[str]:
        """Fallback: split by character count with overlap."""
        chunks: list[str] = []
        start = 0
        while start < len(text):
            end = min(start + chunk_size, len(text))
            chunks.append(text[start:end])
            # Advance by chunk_size minus overlap
            step = max(chunk_size - overlap, 1)
            start += step

        return [c for c in chunks if c.strip()]
