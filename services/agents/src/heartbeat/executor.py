"""HeartbeatExecutor -- runs a single proactive scan for one archetype."""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from src.heartbeat.models import HeartbeatResult
from src.llm.base import BaseLLMClient
from src.heartbeat.prompts import ARCHETYPE_SCAN_FOCUS, HEARTBEAT_BASE_PROMPT
from src.memory.retriever import MemoryRetriever

logger = logging.getLogger(__name__)

# Human-readable display names for each archetype slug.
ARCHETYPE_DISPLAY_NAMES: dict[str, str] = {
    "development_director": "Development Director",
    "marketing_director": "Marketing Director",
    "executive_assistant": "Executive Assistant",
    "programs_director": "Programs Director",
    "hr_volunteer_coordinator": "HR & Volunteer Coordinator",
    "events_director": "Events Director",
}


class HeartbeatExecutor:
    """Runs a proactive domain scan for one archetype and returns a HeartbeatResult.

    Parameters
    ----------
    client : BaseLLMClient
        Pre-initialised LLM client (carries the org's API key).
    memory : MemoryRetriever
        Memory retriever scoped to the org.
    org_id : str
        Organisation identifier for logging and result tagging.
    """

    def __init__(
        self,
        client: BaseLLMClient,
        memory: MemoryRetriever,
        org_id: str,
    ) -> None:
        self._client = client
        self._memory = memory
        self._org_id = org_id

    async def run_scan(
        self,
        archetype: str,
        org_name: str,
        org_mission: str,
    ) -> HeartbeatResult:
        """Execute a proactive scan and return a structured result.

        Parameters
        ----------
        archetype : str
            One of the 7 archetype slugs.
        org_name : str
            Display name of the organisation (used in the prompt).
        org_mission : str
            One-line mission statement (used as the memory search query).

        Returns
        -------
        HeartbeatResult
            Populated result; ``skipped=True`` if nothing noteworthy was found.
        """
        display_name = ARCHETYPE_DISPLAY_NAMES.get(archetype, archetype.replace("_", " ").title())
        result_id = str(uuid.uuid4())
        now_utc = datetime.now(timezone.utc).isoformat()

        scan_focus = ARCHETYPE_SCAN_FOCUS.get(archetype, "")
        system_prompt = HEARTBEAT_BASE_PROMPT.format(
            role=display_name,
            org_name=org_name,
            scan_focus=scan_focus,
        )

        # Retrieve domain-scoped org memory
        memory_query = f"{archetype.replace('_', ' ')} {org_mission}"
        memory_items = await self._memory.retrieve(query=memory_query, limit=10)

        # Build the user message from memory items
        if memory_items:
            memory_block = "\n\n".join(
                f"[{item.get('category', 'note')}] {item.get('title', '')}\n{item.get('content', '')}"
                for item in memory_items
            )
            user_content = (
                f"Org memory for {org_name}:\n\n{memory_block}\n\n"
                "Based on this information, what does the leader need to know right now?"
            )
        else:
            user_content = (
                f"No org memory is available yet for {org_name}. "
                "Respond with [NOTHING_NEW] unless you have a general standing recommendation."
            )

        messages = [{"role": "user", "content": user_content}]

        try:
            response = await self._client.complete(
                system=system_prompt,
                messages=messages,
                tools=None,
                tool_executor=None,
                max_tokens=500,
                temperature=0.25,
            )
        except Exception as exc:
            logger.exception(
                "Heartbeat scan failed for org=%s archetype=%s: %s",
                self._org_id,
                archetype,
                exc,
            )
            return HeartbeatResult(
                id=result_id,
                org_id=self._org_id,
                archetype=archetype,
                display_name=display_name,
                title="Check-in unavailable",
                body=f"This team member could not complete their check-in: {exc}",
                suggested_action=None,
                skipped=True,
                skipped_reason=f"Scan error: {type(exc).__name__}",
                created_at=now_utc,
                token_usage=0,
            )

        # Extract token usage
        usage = response.get("usage", {})
        token_usage = usage.get("input_tokens", 0) + usage.get("output_tokens", 0)

        # Extract raw text from response
        raw_text = ""
        for block in response.get("content", []):
            if block.get("type") == "text":
                raw_text += block.get("text", "")

        raw_text = raw_text.strip()
        logger.debug("Heartbeat raw response for %s/%s: %s", self._org_id, archetype, raw_text[:200])

        return self._parse_response(
            raw_text=raw_text,
            result_id=result_id,
            archetype=archetype,
            display_name=display_name,
            now_utc=now_utc,
            token_usage=token_usage,
        )

    # ------------------------------------------------------------------
    # Response parsing
    # ------------------------------------------------------------------

    def _parse_response(
        self,
        raw_text: str,
        result_id: str,
        archetype: str,
        display_name: str,
        now_utc: str,
        token_usage: int,
    ) -> HeartbeatResult:
        """Parse LLM output into a HeartbeatResult."""

        # Nothing new signal
        if "[NOTHING_NEW]" in raw_text:
            return HeartbeatResult(
                id=result_id,
                org_id=self._org_id,
                archetype=archetype,
                display_name=display_name,
                title="Nothing new",
                body="",
                suggested_action=None,
                skipped=True,
                skipped_reason="No noteworthy items found in org memory.",
                created_at=now_utc,
                token_usage=token_usage,
            )

        # Parse structured markers
        title = ""
        body = ""
        suggested_action: str | None = None

        # Extract [TITLE: ...]
        if "[TITLE:" in raw_text:
            title_start = raw_text.index("[TITLE:") + len("[TITLE:")
            title_end = raw_text.index("]", title_start)
            title = raw_text[title_start:title_end].strip()
            remainder = raw_text[title_end + 1:].strip()
        else:
            # Fallback: first line as title
            lines = raw_text.splitlines()
            title = lines[0].strip() if lines else "Update from your team"
            remainder = "\n".join(lines[1:]).strip()

        # Extract [ACTION: ...]
        if "[ACTION:" in remainder:
            action_start = remainder.index("[ACTION:") + len("[ACTION:")
            action_end = remainder.index("]", action_start)
            suggested_action = remainder[action_start:action_end].strip()
            body = remainder[: remainder.index("[ACTION:")].strip()
        else:
            body = remainder.strip()

        # Ensure we have at least something in body
        if not body and title:
            body = title
            title = "Update from your team"

        return HeartbeatResult(
            id=result_id,
            org_id=self._org_id,
            archetype=archetype,
            display_name=display_name,
            title=title or "Update from your team",
            body=body,
            suggested_action=suggested_action,
            skipped=False,
            skipped_reason=None,
            created_at=now_utc,
            token_usage=token_usage,
        )
