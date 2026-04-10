"""Planner agent -- decomposes a user request into subtasks.

The planner calls Claude with the primary agent's system prompt and asks
it to break the request into a structured plan of subtask steps.  For
simple requests it may return a single step (the primary agent handles
it directly).
"""

from __future__ import annotations

import json
import logging
from typing import Any

from src.api.models import SubtaskPlan
from src.claude.client import ClaudeClient

logger = logging.getLogger(__name__)

PLANNING_INSTRUCTION = """
You are an AI planning assistant. Given the user's request and your agent role context,
break the request into a list of concrete subtasks that can be executed sequentially.

For each subtask, specify:
- "subagent": the role slug of the agent best suited for the step (use "self" if the
  primary agent should handle it directly)
- "task_description": a clear, actionable description of what to do
- "depends_on": list of subtask descriptions this step depends on (empty if independent)
- "priority": 1 (highest) to 5 (lowest)

If the request is simple and can be handled in a single step, return a list with one item.

IMPORTANT: Respond ONLY with a JSON array. No markdown, no explanation.

Example:
[
  {
    "subagent": "self",
    "task_description": "Draft a thank-you email to the donor",
    "depends_on": [],
    "priority": 1
  }
]
"""


class PlannerAgent:
    """Decomposes a user request into an ordered list of subtasks."""

    def __init__(self, client: ClaudeClient) -> None:
        self._client = client

    async def plan(
        self,
        user_message: str,
        agent_system_prompt: str,
        org_context: list[dict[str, Any]],
    ) -> list[SubtaskPlan]:
        """Return a plan of subtasks for the given user message.

        Parameters
        ----------
        user_message : str
            The raw request from the user.
        agent_system_prompt : str
            The primary agent's hydrated system prompt (provides role context).
        org_context : list[dict]
            Relevant memory items retrieved for the org.
        """

        # Build the system prompt: agent context + planning instructions
        context_text = ""
        if org_context:
            context_text = "\n\n## Organisational Context\n"
            for item in org_context[:5]:
                context_text += f"- **{item.get('title', 'Untitled')}**: {item.get('content', '')[:200]}\n"

        system = agent_system_prompt + context_text + "\n\n" + PLANNING_INSTRUCTION

        messages = [{"role": "user", "content": user_message}]

        response = await self._client.complete(
            system=system,
            messages=messages,
            model=None,  # use default
            max_tokens=2048,
            temperature=0.2,  # low temp for structured planning
        )

        # Extract the text from the response
        raw_text = self._extract_text(response)
        return self._parse_plan(raw_text)

    @staticmethod
    def _extract_text(response: dict[str, Any]) -> str:
        """Pull the text content out of an Anthropic response."""
        for block in response.get("content", []):
            if block.get("type") == "text":
                return block["text"]
        return ""

    @staticmethod
    def _parse_plan(raw: str) -> list[SubtaskPlan]:
        """Parse the JSON array returned by Claude into SubtaskPlan models."""
        # Strip any markdown fencing Claude might have added
        text = raw.strip()
        if text.startswith("```"):
            lines = text.splitlines()
            lines = [l for l in lines if not l.strip().startswith("```")]
            text = "\n".join(lines)

        try:
            items = json.loads(text)
        except json.JSONDecodeError:
            logger.warning("Failed to parse plan JSON, falling back to single-step plan.")
            return [
                SubtaskPlan(
                    subagent="self",
                    task_description=raw[:500] if raw else "Handle the user's request directly.",
                    depends_on=[],
                    priority=1,
                )
            ]

        if not isinstance(items, list):
            items = [items]

        plans: list[SubtaskPlan] = []
        for item in items:
            plans.append(
                SubtaskPlan(
                    subagent=item.get("subagent", "self"),
                    task_description=item.get("task_description", ""),
                    depends_on=item.get("depends_on", []),
                    priority=item.get("priority", 1),
                )
            )

        return plans or [
            SubtaskPlan(
                subagent="self",
                task_description="Handle the user's request.",
                depends_on=[],
                priority=1,
            )
        ]
