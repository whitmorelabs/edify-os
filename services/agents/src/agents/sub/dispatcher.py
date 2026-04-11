"""Subagent dispatcher -- routes delegation requests from primary agents.

The dispatcher is the single point of contact for primary agents that
want to hand off a focused task.  It:

1. Looks up the requested slug in the registry.
2. Instantiates the subagent (injecting the shared client + memory).
3. Calls ``execute()`` and returns the ``SubagentResult``.
4. Logs the dispatch for observability.
"""

from __future__ import annotations

import logging
from typing import Any

from src.agents.sub.base_subagent import BaseSubagent, SubagentResult
from src.llm.base import BaseLLMClient
from src.memory.retriever import MemoryRetriever

logger = logging.getLogger(__name__)


class SubagentDispatcher:
    """Instantiates and runs subagents on behalf of primary agents.

    Parameters
    ----------
    registry : dict[str, type[BaseSubagent]]
        Maps slug strings to subagent classes.  The dispatcher owns
        instantiation, so classes (not instances) are registered.
    client : BaseLLMClient
        Shared LLM client passed to each subagent.
    memory : MemoryRetriever
        Shared memory retriever passed to each subagent.
    """

    def __init__(
        self,
        registry: dict[str, type[BaseSubagent]],
        client: BaseLLMClient,
        memory: MemoryRetriever,
    ) -> None:
        self._registry = registry
        self._client = client
        self._memory = memory

    async def dispatch(
        self,
        slug: str,
        instruction: str,
        context: dict[str, Any],
    ) -> SubagentResult:
        """Delegate a task to the named subagent.

        Parameters
        ----------
        slug : str
            The subagent identifier (must exist in the registry).
        instruction : str
            The focused task description from the primary agent.
        context : dict
            Org context to pass through (org_name, org_mission, etc.).

        Returns
        -------
        SubagentResult

        Raises
        ------
        KeyError
            If ``slug`` is not registered.
        """
        subagent_cls = self._registry.get(slug)
        if subagent_cls is None:
            registered = list(self._registry.keys())
            raise KeyError(
                f"No subagent registered for slug {slug!r}. "
                f"Registered slugs: {registered}"
            )

        subagent = subagent_cls(client=self._client, memory=self._memory)

        logger.info(
            "Dispatching subagent | slug=%s parent_role=%s instruction_preview=%r",
            slug,
            subagent.parent_role,
            instruction[:120],
        )

        # Pass the instruction along as a hint so memory retrieval is targeted
        context_with_hint = {**context, "instruction_hint": instruction}

        result = await subagent.execute(instruction, context_with_hint)

        # Estimate token usage for logging (rough: 4 chars ~ 1 token)
        approx_tokens = len(result.text) // 4
        logger.info(
            "Subagent complete | slug=%s approx_output_tokens=%d artifact_type=%s",
            slug,
            approx_tokens,
            result.artifact_type,
        )

        return result

    def registered_slugs(self) -> list[str]:
        """Return the list of currently registered subagent slugs."""
        return list(self._registry.keys())
