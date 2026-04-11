"""Base class for all primary agents in Edify OS.

Centralises the full execute() pipeline, delegation machinery, inline
fallback, and tool executor so that each concrete primary agent only
needs to declare its registry, delegation keywords, and (optionally)
its subagent result framing.
"""

from __future__ import annotations

import logging
from abc import abstractmethod
from typing import Any

from src.agents.base import BaseAgent
from src.agents.sub.dispatcher import SubagentDispatcher
from src.claude.client import ClaudeClient
from src.claude.tools import ALL_TOOLS
from src.memory.retriever import MemoryRetriever

logger = logging.getLogger(__name__)


class BasePrimaryAgent(BaseAgent):
    """Shared execute pipeline for all primary agents.

    Subclasses must define:
    - ``role_slug`` / ``display_name`` / ``temperature`` (class attrs)
    - ``_SUBAGENT_REGISTRY`` (class attr, dict[str, type])
    - ``_should_delegate()`` (instance method)

    Subclasses may optionally override:
    - ``_frame_subagent_result()`` for custom voice preambles
    """

    # Subclasses override with their own registry
    _SUBAGENT_REGISTRY: dict[str, Any] = {}

    def __init__(
        self,
        client: ClaudeClient,
        memory: MemoryRetriever,
    ) -> None:
        self._client = client
        self._memory = memory
        self._dispatcher = SubagentDispatcher(
            registry=self.__class__._SUBAGENT_REGISTRY,
            client=client,
            memory=memory,
        )

    # ------------------------------------------------------------------
    # Main pipeline
    # ------------------------------------------------------------------

    async def execute(
        self,
        user_input: str,
        context: dict[str, Any],
    ) -> dict[str, Any]:
        """Handle a request end-to-end.

        Checks whether to delegate to a subagent; if not, handles inline.
        """
        delegate_slug = self._should_delegate(user_input)
        if delegate_slug is not None:
            return await self._delegate_and_present(
                slug=delegate_slug,
                user_input=user_input,
                context=context,
            )

        # Inline handling
        system_prompt = await self._build_system_prompt(user_input, context)
        messages = [{"role": "user", "content": user_input}]

        response = await self._client.complete(
            system=system_prompt,
            messages=messages,
            tools=ALL_TOOLS,
            tool_executor=self._tool_executor,
            model=self.model,
            max_tokens=4096,
            temperature=self.temperature,
        )

        return {
            "response": self._extract_text(response),
            "structured_data": {},
            "agent": self.role_slug,
        }

    # ------------------------------------------------------------------
    # Delegation logic
    # ------------------------------------------------------------------

    @abstractmethod
    def _should_delegate(self, user_input: str) -> str | None:
        """Return a subagent slug to delegate to, or None for inline handling.

        Detection is keyword-based.  A future iteration can swap this for
        an LLM intent classifier without touching the execute() pipeline.
        """
        ...

    async def _delegate_and_present(
        self,
        slug: str,
        user_input: str,
        context: dict[str, Any],
    ) -> dict[str, Any]:
        """Dispatch to a subagent and wrap the result in the agent's voice."""
        logger.info("%s delegating to subagent: %s", self.__class__.__name__, slug)

        try:
            result = await self._dispatcher.dispatch(
                slug=slug,
                instruction=user_input,
                context=context,
            )
        except Exception as exc:
            logger.exception("Subagent dispatch failed: %s", exc)
            logger.info("Falling back to inline handling after subagent failure.")
            return await self._inline_fallback(user_input, context)

        framing = self._frame_subagent_result(slug, result.text)

        return {
            "response": framing,
            "structured_data": result.structured_data or {},
            "agent": self.role_slug,
            "delegated_to": slug,
            "artifact_type": result.artifact_type,
        }

    def _frame_subagent_result(self, slug: str, subagent_text: str) -> str:
        """Add an agent-voice preamble to the subagent's output.

        The default implementation uses ``_PREAMBLES`` if defined on the
        subclass, falling back to a generic message.  Override entirely for
        custom behaviour.
        """
        preambles: dict[str, str] = getattr(self.__class__, "_PREAMBLES", {})
        preamble = preambles.get(slug, "Here is the output from my specialist review:\n\n")
        return preamble + subagent_text
