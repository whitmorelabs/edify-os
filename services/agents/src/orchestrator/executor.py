"""Subtask executor -- runs a single subtask via the appropriate subagent.

The executor loads the subagent's prompt template, hydrates it with org
context, and calls Claude with tool-use enabled.  Tool calls are handled
internally by the ClaudeClient's tool-use loop.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any

from src.api.models import SubtaskPlan
from src.claude.tools import ALL_TOOLS
from src.llm.base import BaseLLMClient
from src.memory.retriever import MemoryRetriever

logger = logging.getLogger(__name__)


class SubtaskResult:
    """Holds the output of a single subtask execution."""

    def __init__(
        self,
        subtask: SubtaskPlan,
        success: bool,
        response_text: str,
        structured_data: dict[str, Any] | None = None,
        error: str | None = None,
    ) -> None:
        self.subtask = subtask
        self.success = success
        self.response_text = response_text
        self.structured_data = structured_data or {}
        self.error = error


class SubagentExecutor:
    """Execute a single subtask using Claude with tools."""

    def __init__(
        self,
        client: BaseLLMClient,
        memory: MemoryRetriever,
        org_id: str,
    ) -> None:
        self._client = client
        self._memory = memory
        self._org_id = org_id

    async def execute(
        self,
        subtask: SubtaskPlan,
        system_prompt: str,
        prior_results: list[SubtaskResult],
    ) -> SubtaskResult:
        """Run a subtask and return the result.

        Parameters
        ----------
        subtask : SubtaskPlan
            The subtask to execute.
        system_prompt : str
            The hydrated system prompt for the agent.
        prior_results : list[SubtaskResult]
            Results from previously completed subtasks (for context chaining).
        """
        # Build context from prior results
        context_parts: list[str] = []
        for pr in prior_results:
            if pr.success:
                context_parts.append(
                    f"[Previous step: {pr.subtask.task_description}]\n"
                    f"{pr.response_text[:500]}"
                )

        user_content = subtask.task_description
        if context_parts:
            user_content += (
                "\n\n## Context from previous steps\n" + "\n\n".join(context_parts)
            )

        messages = [{"role": "user", "content": user_content}]

        try:
            response = await self._client.complete(
                system=system_prompt,
                messages=messages,
                tools=ALL_TOOLS,
                tool_executor=self._handle_tool_call,
                max_tokens=4096,
                temperature=0.3,
            )

            text, structured = self._extract_response(response)

            return SubtaskResult(
                subtask=subtask,
                success=True,
                response_text=text,
                structured_data=structured,
            )

        except Exception as exc:
            logger.exception("Subtask failed: %s", subtask.task_description)
            return SubtaskResult(
                subtask=subtask,
                success=False,
                response_text="",
                error=str(exc),
            )

    # ------------------------------------------------------------------
    # Tool execution handler
    # ------------------------------------------------------------------

    async def _handle_tool_call(self, name: str, input_data: dict[str, Any]) -> str:
        """Execute a tool call from Claude and return a string result."""

        if name == "retrieve_memory":
            results = await self._memory.retrieve(
                query=input_data["query"],
                limit=input_data.get("limit", 5),
            )
            if not results:
                return "No relevant memories found."
            return json.dumps(results, indent=2)

        elif name == "save_finding":
            row_id = await self._memory.save(
                title=input_data["title"],
                content=input_data["content"],
                category=input_data["category"],
                tags=input_data.get("tags"),
            )
            return f"Finding saved (id: {row_id})." if row_id else "Finding saved (no DB)."

        elif name == "search_web":
            query = input_data["query"]
            return (
                f"[Web search placeholder] No live search configured yet. "
                f"Query was: {query}. In production this would return search results."
            )

        elif name == "generate_document":
            return (
                f"Document generation acknowledged. Type: {input_data['document_type']}, "
                f"Title: {input_data['title']}. "
                f"Please produce the document content in your response."
            )

        else:
            return f"Unknown tool: {name}"

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _extract_response(response: dict[str, Any]) -> tuple[str, dict[str, Any]]:
        """Extract text and any structured data from the Anthropic response."""
        text_parts: list[str] = []
        structured: dict[str, Any] = {}

        for block in response.get("content", []):
            if block.get("type") == "text":
                text_parts.append(block["text"])

        full_text = "\n".join(text_parts)

        # Try to extract JSON blocks from the text as structured data
        if "```json" in full_text:
            json_blocks = re.findall(r"```json\s*(.*?)```", full_text, re.DOTALL)
            for i, jb in enumerate(json_blocks):
                try:
                    parsed = json.loads(jb)
                    structured[f"json_block_{i}"] = parsed
                except json.JSONDecodeError:
                    pass

        return full_text, structured
