"""Synthesis engine for Decision Lab.

Takes all archetype responses and produces a cross-archetype
consensus/disagreement/risk/action summary via a neutral LLM call.
"""

from __future__ import annotations

import logging
import re

from src.claude.client import ClaudeClient
from src.decision_lab.models import ArchetypeResponse, Synthesis
from src.decision_lab.prompts import SYNTHESIS_PROMPT, extract_text

logger = logging.getLogger(__name__)

# Section header patterns for parsing the structured LLM output
_SECTION_RE = re.compile(
    r"##\s*CONSENSUS\s*(.*?)##\s*DISAGREEMENTS\s*(.*?)##\s*TOP RISKS\s*(.*?)##\s*RECOMMENDED ACTION\s*(.*?)$",
    re.DOTALL | re.IGNORECASE,
)

# Numbered list item: "1. text" or "- text" or "* text"
_LIST_ITEM_RE = re.compile(r"^\s*(?:\d+[.)]\s*|[-*]\s+)(.+)$", re.MULTILINE)


def _extract_list_items(text: str) -> list[str]:
    """Pull numbered/bulleted list items from a text block."""
    items = [m.group(1).strip() for m in _LIST_ITEM_RE.finditer(text)]
    # Fallback: if no list markers found, split non-empty lines
    if not items:
        items = [line.strip() for line in text.strip().splitlines() if line.strip()]
    return items


def _format_responses(responses: list[ArchetypeResponse]) -> str:
    """Format archetype responses into a readable block for the synthesis prompt."""
    parts: list[str] = []
    for r in responses:
        parts.append(
            f"**{r.display_name}** (Stance: {r.stance.upper()}, Confidence: {r.confidence.upper()})\n"
            f"{r.response_text.strip()}"
        )
    return "\n\n---\n\n".join(parts)


class SynthesisEngine:
    """Calls the LLM as a neutral facilitator to synthesize all archetype responses."""

    def __init__(self, client: ClaudeClient) -> None:
        self._client = client

    async def synthesize(
        self,
        scenario_text: str,
        responses: list[ArchetypeResponse],
    ) -> Synthesis:
        """Produce a Synthesis from all archetype responses.

        Parameters
        ----------
        scenario_text : str
            The original decision being analyzed.
        responses : list[ArchetypeResponse]
            Individual archetype analyses to synthesize.

        Returns
        -------
        Synthesis
        """
        formatted = _format_responses(responses)
        system_prompt = SYNTHESIS_PROMPT.format(
            archetype_count=len(responses),
            scenario_text=scenario_text,
            formatted_responses=formatted,
        )

        logger.info("Running synthesis over %d archetype responses.", len(responses))

        api_response = await self._client.complete(
            system="You are a neutral strategic facilitator. Follow all formatting instructions precisely.",
            messages=[{"role": "user", "content": system_prompt}],
            max_tokens=1000,
            temperature=0.2,
        )

        raw_text = extract_text(api_response)
        return self._parse_synthesis(raw_text)

    # ------------------------------------------------------------------
    # Parsing helpers
    # ------------------------------------------------------------------

    def _parse_synthesis(self, text: str) -> Synthesis:
        """Parse the structured LLM output into a Synthesis object."""
        match = _SECTION_RE.search(text)

        if match:
            consensus_raw, disagreements_raw, risks_raw, action_raw = match.groups()
            consensus = _extract_list_items(consensus_raw)
            disagreements = _extract_list_items(disagreements_raw)
            top_risks = _extract_list_items(risks_raw)[:3]  # cap at 3
            recommended_action = action_raw.strip()
            # Clean up recommended_action if it's a list; take first item
            if recommended_action.startswith(("-", "*", "1")):
                items = _extract_list_items(recommended_action)
                recommended_action = items[0] if items else recommended_action
        else:
            logger.warning("Synthesis output did not match expected structure -- using fallback parsing.")
            consensus, disagreements, top_risks = [], [], []
            recommended_action = text.strip()

        return Synthesis(
            consensus=consensus,
            disagreements=disagreements,
            top_risks=top_risks,
            recommended_action=recommended_action or "See individual archetype analyses for recommendations.",
        )

