"""Development Director primary agent.

Handles grant research, donor outreach, fundraising strategy,
prospect identification, and development communications for
nonprofit organisations.
"""

from __future__ import annotations

import json
from typing import Any

from src.agents.base import BaseAgent
from src.claude.client import ClaudeClient
from src.claude.tools import ALL_TOOLS
from src.memory.retriever import MemoryRetriever
from src.prompts.loader import PromptLoader


class DevelopmentDirector(BaseAgent):
    role_slug = "development_director"
    display_name = "Development Director"
    model = "claude-sonnet-4-20250514"
    temperature = 0.35

    def __init__(
        self,
        client: ClaudeClient,
        memory: MemoryRetriever,
    ) -> None:
        self._client = client
        self._memory = memory

    async def execute(
        self,
        user_input: str,
        context: dict[str, Any],
    ) -> dict[str, Any]:
        """Handle a development/fundraising request end-to-end.

        Supports:
        - Grant research and eligibility analysis
        - Donor outreach email drafting
        - Fundraising strategy and planning
        - Prospect identification and profiling
        - Stewardship communications (thank-you letters, impact reports)
        - Campaign planning and timeline creation
        """
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

        messages = [{"role": "user", "content": user_input}]

        async def tool_executor(name: str, input_data: dict[str, Any]) -> str:
            if name == "retrieve_memory":
                results = await self._memory.retrieve(
                    query=input_data["query"],
                    limit=input_data.get("limit", 5),
                )
                return json.dumps(results, indent=2) if results else "No relevant memories found."
            elif name == "save_finding":
                row_id = await self._memory.save(
                    title=input_data["title"],
                    content=input_data["content"],
                    category=input_data["category"],
                    tags=input_data.get("tags"),
                )
                return f"Saved (id: {row_id})." if row_id else "Saved (no DB)."
            elif name == "generate_document":
                return (
                    f"Document generation acknowledged: {input_data['document_type']} - "
                    f"{input_data['title']}. Please produce the content inline."
                )
            elif name == "search_web":
                return f"[Web search placeholder] Query: {input_data['query']}"
            return f"Unknown tool: {name}"

        response = await self._client.complete(
            system=system_prompt,
            messages=messages,
            tools=ALL_TOOLS,
            tool_executor=tool_executor,
            model=self.model,
            max_tokens=4096,
            temperature=self.temperature,
        )

        text_parts = []
        for block in response.get("content", []):
            if block.get("type") == "text":
                text_parts.append(block["text"])

        return {
            "response": "\n".join(text_parts),
            "structured_data": {},
            "agent": self.role_slug,
        }
