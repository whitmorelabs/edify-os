"""Decision Lab orchestrator.

Dispatches a scenario to all selected archetypes in parallel,
parses their responses, then passes everything to the synthesis engine.
"""

from __future__ import annotations

import asyncio
import logging
import re
import uuid
from datetime import datetime, timezone
from typing import Any

from src.claude.client import ClaudeClient
from src.decision_lab.models import ArchetypeResponse, ScenarioResult
from src.decision_lab.prompts import DECISION_LAB_SYSTEM_PROMPT, FOLLOW_UP_PROMPT, extract_text
from src.decision_lab.synthesis import SynthesisEngine
from src.memory.retriever import MemoryRetriever
from src.prompts.loader import PromptLoader

logger = logging.getLogger(__name__)

# All supported archetype slugs in their canonical order
ALL_ARCHETYPES: list[str] = [
    "development_director",
    "marketing_director",
    "executive_assistant",
    "programs_director",
    "finance_director",
    "hr_volunteer_coordinator",
    "events_director",
]

# Map slug -> display_name (mirrors agent class attrs)
_DISPLAY_NAMES: dict[str, str] = {
    "development_director": "Development Director",
    "marketing_director": "Marketing Director",
    "executive_assistant": "Executive Assistant",
    "programs_director": "Programs Director",
    "finance_director": "Finance Director",
    "hr_volunteer_coordinator": "HR & Volunteer Coordinator",
    "events_director": "Events Director",
}

# Parse [STANCE: X] [CONFIDENCE: Y] from the first line of an archetype response
_HEADER_RE = re.compile(
    r"\[STANCE:\s*(SUPPORT|CAUTION|OPPOSE)\]\s*\[CONFIDENCE:\s*(LOW|MEDIUM|HIGH)\]",
    re.IGNORECASE,
)


def _parse_archetype_header(
    text: str,
) -> tuple[str, str, str]:
    """Extract stance and confidence from the response header.

    Returns
    -------
    tuple[stance, confidence, response_body]
        stance and confidence are lowercased; response_body is the text
        with the header line stripped.
    """
    first_line = text.split("\n", 1)[0]
    match = _HEADER_RE.search(first_line)

    if match:
        stance = match.group(1).lower()
        confidence = match.group(2).lower()
        # Strip the header line from the body
        body = text.split("\n", 1)[1].strip() if "\n" in text else text
    else:
        logger.warning("Could not parse stance/confidence header from response: %r", first_line[:80])
        stance = "caution"
        confidence = "low"
        body = text.strip()

    return stance, confidence, body  # type: ignore[return-value]


class DecisionLabOrchestrator:
    """Runs a decision scenario through all (or selected) archetypes in parallel."""

    def __init__(
        self,
        client: ClaudeClient,
        memory: MemoryRetriever,
        org_id: str,
    ) -> None:
        self._client = client
        self._memory = memory
        self._org_id = org_id
        self._synthesis_engine = SynthesisEngine(client=client)

    async def close(self) -> None:
        await self._client.close()

    async def run_scenario(
        self,
        scenario_text: str,
        selected_archetypes: list[str] | None = None,
        context: dict[str, Any] | None = None,
    ) -> ScenarioResult:
        """Dispatch scenario to archetypes, synthesize, and return the full result.

        Parameters
        ----------
        scenario_text : str
            The decision being evaluated.
        selected_archetypes : list[str] | None
            Subset of archetype slugs to consult. Defaults to all 7.
        context : dict | None
            Org context (org_name, org_mission, active_goals).
        """
        archetypes = selected_archetypes or ALL_ARCHETYPES
        context = context or {}

        logger.info(
            "Decision Lab: org=%s archetypes=%s scenario=%s",
            self._org_id,
            archetypes,
            scenario_text[:80],
        )

        # Dispatch all archetypes concurrently
        tasks = [
            self._query_archetype(slug, scenario_text, context)
            for slug in archetypes
        ]
        responses: list[ArchetypeResponse] = await asyncio.gather(*tasks)

        # Filter out any None results (failed archetype calls)
        valid_responses = [r for r in responses if r is not None]

        # Synthesize across all responses
        synthesis = await self._synthesis_engine.synthesize(
            scenario_text=scenario_text,
            responses=valid_responses,
        )

        return ScenarioResult(
            scenario_id=str(uuid.uuid4()),
            scenario_text=scenario_text,
            responses=valid_responses,
            synthesis=synthesis,
            created_at=datetime.now(tz=timezone.utc).isoformat(),
        )

    async def run_follow_up(
        self,
        scenario_text: str,
        original_response: ArchetypeResponse,
        follow_up_question: str,
        context: dict[str, Any] | None = None,
    ) -> ArchetypeResponse:
        """Re-query a single archetype with the original scenario + follow-up question.

        Parameters
        ----------
        scenario_text : str
            The original decision text.
        original_response : ArchetypeResponse
            The archetype's first analysis.
        follow_up_question : str
            The leader's follow-up question.
        context : dict | None
            Org context.
        """
        context = context or {}
        org_name = context.get("org_name", "the organisation")
        role_slug = original_response.role_slug
        display_name = _DISPLAY_NAMES.get(role_slug, original_response.display_name)

        system_prompt = FOLLOW_UP_PROMPT.format(
            org_name=org_name,
            scenario_text=scenario_text,
            original_response_text=original_response.response_text,
            follow_up_question=follow_up_question,
            role=display_name,
        )

        logger.info("Decision Lab follow-up: archetype=%s", role_slug)

        try:
            api_response = await self._client.complete(
                system=system_prompt,
                messages=[{"role": "user", "content": follow_up_question}],
                max_tokens=500,
                temperature=0.3,
            )
            raw_text = extract_text(api_response)
        except Exception as exc:
            logger.exception("Follow-up call failed for %s: %s", role_slug, exc)
            raw_text = f"[STANCE: CAUTION] [CONFIDENCE: LOW]\nUnable to generate follow-up: {exc}"

        stance, confidence, body = _parse_archetype_header(raw_text)
        return ArchetypeResponse(
            role_slug=role_slug,
            display_name=display_name,
            stance=stance,  # type: ignore[arg-type]
            response_text=body,
            confidence=confidence,  # type: ignore[arg-type]
        )

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    async def _query_archetype(
        self,
        role_slug: str,
        scenario_text: str,
        context: dict[str, Any],
    ) -> ArchetypeResponse | None:
        """Load the archetype's prompt, hydrate it with Decision Lab mode, call LLM."""
        display_name = _DISPLAY_NAMES.get(role_slug, role_slug)
        org_name = context.get("org_name", "the organisation")
        org_mission = context.get("org_mission", "")
        active_goals = context.get("active_goals", "")

        try:
            # Load and hydrate the base prompt template
            template = PromptLoader.load(role_slug=role_slug, category="primary")
            base_prompt = PromptLoader.hydrate(template, {
                "org_name": org_name,
                "org_mission": org_mission,
                "active_goals": active_goals,
                "memory_context": "",  # not used in Decision Lab mode
            })

            # Retrieve domain-scoped memory for this archetype
            memories = await self._memory.retrieve(
                query=f"{scenario_text} {role_slug}",
                limit=3,
            )
            memory_block = ""
            if memories:
                memory_block = "\n\n## Relevant Org Memory\n"
                for m in memories:
                    memory_block += f"- {m['title']}: {m['content'][:120]}\n"

            # Build the Decision Lab mode system prompt as a prefix
            decision_lab_prefix = DECISION_LAB_SYSTEM_PROMPT.format(
                org_name=org_name,
                scenario_text=scenario_text,
                role=display_name,
            )

            system_prompt = decision_lab_prefix + "\n\n---\n\n" + base_prompt + memory_block

            api_response = await self._client.complete(
                system=system_prompt,
                messages=[{"role": "user", "content": scenario_text}],
                max_tokens=500,
                temperature=0.3,
            )
            raw_text = extract_text(api_response)

        except FileNotFoundError:
            logger.error("Prompt template not found for archetype: %s -- skipping.", role_slug)
            return None
        except Exception as exc:
            logger.exception("Archetype %s failed: %s", role_slug, exc)
            return ArchetypeResponse(
                role_slug=role_slug,
                display_name=display_name,
                stance="caution",
                response_text=f"This archetype was unable to complete its analysis: {exc}",
                confidence="low",
            )

        stance, confidence, body = _parse_archetype_header(raw_text)
        return ArchetypeResponse(
            role_slug=role_slug,
            display_name=display_name,
            stance=stance,  # type: ignore[arg-type]
            response_text=body,
            confidence=confidence,  # type: ignore[arg-type]
        )

