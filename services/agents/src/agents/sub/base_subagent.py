"""Abstract base class for all Edify subagents.

Subagents are short-lived specialists that receive a focused instruction
from a primary agent, execute it against org memory, and return a
structured result.  They are NOT BaseAgent subclasses -- they have a
different contract: they take an instruction (not raw user input) and
return a SubagentResult dataclass rather than a generic dict.
"""

from __future__ import annotations

import logging
from abc import ABC
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from src.claude.client import ClaudeClient
from src.memory.retriever import MemoryRetriever

logger = logging.getLogger(__name__)

# Prompts are stored under src/prompts/sub/
# __file__ = .../src/agents/sub/base_subagent.py
# parents[0] = sub, parents[1] = agents, parents[2] = src
_PROMPTS_DIR = Path(__file__).resolve().parents[2] / "prompts" / "sub"


@dataclass
class SubagentResult:
    """The output of a single subagent execution.

    Parameters
    ----------
    text : str
        The primary textual output produced by the subagent.
    structured_data : dict | None
        Optional machine-readable payload (e.g. a ranked list of grants).
    artifact_type : str | None
        Optional hint about what ``text`` contains, e.g. ``"grant_draft"``,
        ``"ranked_list"``, ``"email_draft"``.
    """

    text: str
    structured_data: dict[str, Any] | None = field(default=None)
    artifact_type: str | None = field(default=None)


class BaseSubagent(ABC):
    """Every subagent in Edify OS inherits from this class.

    Class attributes
    ----------------
    slug : str
        Unique identifier; must match the prompt file name (``{slug}.md``).
    display_name : str
        Human-readable label shown in logs and the UI.
    parent_role : str
        The ``role_slug`` of the primary agent that owns this subagent.
    artifact_type : str
        The artifact_type tag returned in SubagentResult.
    temperature : float
        Sampling temperature for the Claude call.
    max_tokens : int
        Token budget for the subagent's Claude call (default 2048).
    """

    # -- Override in subclasses ----------------------------------------
    slug: str = ""
    display_name: str = ""
    parent_role: str = ""
    artifact_type: str = ""
    temperature: float = 0.2
    max_tokens: int = 2048
    model: str = "claude-sonnet-4-20250514"

    def __init__(
        self,
        client: ClaudeClient,
        memory: MemoryRetriever,
    ) -> None:
        self._client = client
        self._memory = memory

    async def execute(
        self,
        instruction: str,
        context: dict[str, Any],
    ) -> SubagentResult:
        """Run the subagent on a focused instruction."""
        system_prompt = await self._build_system_prompt(context)
        messages = [{"role": "user", "content": instruction}]

        response = await self._client.complete(
            system=system_prompt,
            messages=messages,
            model=self.model,
            max_tokens=self.max_tokens,
            temperature=self.temperature,
        )

        text = self._extract_text(response)
        return SubagentResult(text=text, artifact_type=self.artifact_type)

    # ------------------------------------------------------------------
    # Helpers available to all subclasses
    # ------------------------------------------------------------------

    def _load_system_prompt(self) -> str:
        """Read the subagent's prompt file from prompts/sub/{slug}.md."""
        path = _PROMPTS_DIR / f"{self.slug}.md"
        if not path.exists():
            raise FileNotFoundError(
                f"Subagent prompt not found: {path}. "
                f"Create prompts/sub/{self.slug}.md to fix this."
            )
        return path.read_text(encoding="utf-8")

    async def _build_system_prompt(self, context: dict[str, Any]) -> str:
        """Load the prompt template and inject org context + memories."""
        base_prompt = self._load_system_prompt()

        # Inject static org context
        org_block = (
            f"\n\n## Organisation Context\n"
            f"**Name:** {context.get('org_name', 'the organisation')}\n"
            f"**Mission:** {context.get('org_mission', '')}\n"
        )

        # Pull relevant memories
        memory_block = ""
        memories = await self._memory.retrieve(
            query=context.get("instruction_hint", ""),
            limit=5,
        )
        if memories:
            memory_block = "\n\n## Relevant Org Memory\n"
            for m in memories:
                memory_block += f"- **{m['title']}**: {m['content'][:200]}\n"

        return base_prompt + org_block + memory_block

    def _extract_text(self, response: dict[str, Any]) -> str:
        """Pull text blocks out of an Anthropic API response."""
        parts: list[str] = []
        for block in response.get("content", []):
            if block.get("type") == "text":
                parts.append(block["text"])
        return "\n".join(parts)

    def __repr__(self) -> str:
        return f"<{type(self).__name__} slug={self.slug!r} parent={self.parent_role!r}>"
