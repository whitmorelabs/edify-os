"""Prompt template loader.

Loads markdown prompt files with YAML frontmatter, parses the metadata,
and performs ``{{variable}}`` substitution with org context data.
"""

from __future__ import annotations

import logging
import re
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# Directory that holds all prompt templates
PROMPTS_DIR = Path(__file__).resolve().parent

# Simple YAML frontmatter regex (between --- delimiters)
_FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)

# Template variable pattern: {{variable_name}}
_VAR_RE = re.compile(r"\{\{(\w+)\}\}")


class PromptTemplate:
    """A parsed prompt template with metadata and body."""

    def __init__(self, metadata: dict[str, Any], body: str) -> None:
        self.metadata = metadata
        self.body = body

    @property
    def role(self) -> str:
        return self.metadata.get("role", "unknown")

    @property
    def model(self) -> str:
        return self.metadata.get("model", "claude-sonnet-4-20250514")

    @property
    def temperature(self) -> float:
        return float(self.metadata.get("temperature", 0.3))

    @property
    def subagents(self) -> list[str]:
        return self.metadata.get("subagents", [])


class PromptLoader:
    """Load and hydrate prompt templates from disk."""

    @staticmethod
    def load(role_slug: str, category: str = "primary") -> PromptTemplate:
        """Load a prompt file by role slug.

        Parameters
        ----------
        role_slug : str
            e.g. ``"executive_assistant"``
        category : str
            Subdirectory under prompts/, e.g. ``"primary"``.

        Returns
        -------
        PromptTemplate
        """
        path = PROMPTS_DIR / category / f"{role_slug}.md"
        if not path.exists():
            raise FileNotFoundError(f"Prompt template not found: {path}")

        raw = path.read_text(encoding="utf-8")
        metadata, body = PromptLoader._parse_frontmatter(raw)
        return PromptTemplate(metadata=metadata, body=body)

    @staticmethod
    def hydrate(template: PromptTemplate, variables: dict[str, str]) -> str:
        """Replace ``{{variable}}`` placeholders with actual values.

        Missing variables are replaced with an empty string and a warning
        is logged.
        """

        def _replacer(match: re.Match) -> str:
            key = match.group(1)
            if key in variables:
                return variables[key]
            logger.warning("Prompt variable {{%s}} has no value -- replaced with ''.", key)
            return ""

        return _VAR_RE.sub(_replacer, template.body)

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    @staticmethod
    def _parse_frontmatter(raw: str) -> tuple[dict[str, Any], str]:
        """Split YAML frontmatter from the markdown body.

        Uses a simple line-based parser to avoid a PyYAML dependency.
        Supports flat key: value pairs and lists (- item).
        """
        match = _FRONTMATTER_RE.match(raw)
        if not match:
            return {}, raw

        fm_text = match.group(1)
        body = raw[match.end():]

        metadata: dict[str, Any] = {}
        current_key: str | None = None

        for line in fm_text.splitlines():
            stripped = line.strip()
            if not stripped or stripped.startswith("#"):
                continue

            # List item
            if stripped.startswith("- ") and current_key is not None:
                if not isinstance(metadata[current_key], list):
                    metadata[current_key] = []
                metadata[current_key].append(stripped[2:].strip())
                continue

            # key: value
            if ":" in stripped:
                key, _, value = stripped.partition(":")
                key = key.strip()
                value = value.strip()

                # Detect upcoming list (value is empty)
                if value == "":
                    metadata[key] = []
                    current_key = key
                else:
                    # Try numeric conversion
                    try:
                        value_parsed: Any = int(value)
                    except ValueError:
                        try:
                            value_parsed = float(value)
                        except ValueError:
                            value_parsed = value
                    metadata[key] = value_parsed
                    current_key = key

        return metadata, body
