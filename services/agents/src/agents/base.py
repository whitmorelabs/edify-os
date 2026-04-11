"""Abstract base class for all Edify agents."""

from __future__ import annotations

import json
import logging
from abc import ABC, abstractmethod
from typing import Any, TYPE_CHECKING

from src.prompts.loader import PromptLoader

if TYPE_CHECKING:
    from src.claude.client import ClaudeClient
    from src.memory.retriever import MemoryRetriever

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """Every agent in Edify OS inherits from this class.

    Subclasses must set the class-level attributes and implement
    :meth:`execute`.
    """

    # -- Override in subclasses ----------------------------------------
    role_slug: str = ""
    display_name: str = ""
    model: str = "claude-sonnet-4-20250514"
    temperature: float = 0.3

    # Injected by __init__ in each subclass
    _client: "ClaudeClient"
    _memory: "MemoryRetriever"

    @abstractmethod
    async def execute(
        self,
        user_input: str,
        context: dict[str, Any],
    ) -> dict[str, Any]:
        """Run the agent on a single input and return the result.

        Parameters
        ----------
        user_input : str
            The task or message to handle.
        context : dict
            Org context, memories, conversation history, etc.

        Returns
        -------
        dict
            Must include at least ``{"response": str}``.
            May also include ``"structured_data"`` and ``"actions"``.
        """
        ...

    # ------------------------------------------------------------------
    # Shared helpers used by all primary agents
    # ------------------------------------------------------------------

    async def _build_system_prompt(self, user_input: str, context: dict[str, Any]) -> str:
        """Load and hydrate the role prompt, then append relevant memories."""
        template = PromptLoader.load(self.role_slug, category="primary")
        system_prompt = PromptLoader.hydrate(template, {
            "org_name": context.get("org_name", "the organisation"),
            "org_mission": context.get("org_mission", ""),
            "active_goals": context.get("active_goals", ""),
        })

        memories = await self._memory.retrieve(query=user_input, limit=5)
        if memories:
            memory_block = "\n\n## Relevant Org Memory\n"
            for m in memories:
                memory_block += f"- {m['title']}: {m['content'][:150]}\n"
            system_prompt += memory_block

        return system_prompt

    async def _tool_executor(self, name: str, input_data: dict[str, Any]) -> str:
        """Handle tool calls from Claude during inline execution."""
        if name == "retrieve_memory":
            results = await self._memory.retrieve(
                query=input_data["query"],
                limit=input_data.get("limit", 5),
            )
            return json.dumps(results, indent=2) if results else "No relevant memories found."
        if name == "save_finding":
            row_id = await self._memory.save(
                title=input_data["title"],
                content=input_data["content"],
                category=input_data["category"],
                tags=input_data.get("tags"),
            )
            return f"Saved (id: {row_id})." if row_id else "Saved (no DB)."
        if name == "generate_document":
            return (
                f"Document generation acknowledged: {input_data['document_type']} - "
                f"{input_data['title']}. Please produce the content inline."
            )
        if name == "search_web":
            return f"[Web search placeholder] Query: {input_data['query']}"
        return f"Unknown tool: {name}"

    @staticmethod
    def _extract_text(response: dict[str, Any]) -> str:
        """Pull joined text from an Anthropic API response."""
        return "\n".join(
            block["text"]
            for block in response.get("content", [])
            if block.get("type") == "text"
        )

    async def _inline_fallback(
        self,
        user_input: str,
        context: dict[str, Any],
    ) -> dict[str, Any]:
        """Handle the request inline when subagent dispatch fails."""
        system_prompt = await self._build_system_prompt(user_input, context)
        messages = [{"role": "user", "content": user_input}]

        response = await self._client.complete(
            system=system_prompt,
            messages=messages,
            model=self.model,
            max_tokens=4096,
            temperature=self.temperature,
        )

        return {
            "response": self._extract_text(response),
            "structured_data": {},
            "agent": self.role_slug,
        }

    def __repr__(self) -> str:
        return f"<{type(self).__name__} role={self.role_slug!r}>"
