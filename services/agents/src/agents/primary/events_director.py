"""Events Director primary agent.

Handles event planning, run-of-show production, sponsorship management,
and post-event evaluation for nonprofit galas, fundraisers, and
community events.

Delegates focused sub-tasks to specialist subagents via
SubagentDispatcher when the request is a better fit for a subagent
than inline handling.
"""

from __future__ import annotations

import logging
from typing import Any

from src.agents.primary.base_primary import BasePrimaryAgent
from src.agents.sub.event_planner import EventPlannerSubagent
from src.agents.sub.post_event_eval import PostEventEvalSubagent
from src.agents.sub.run_of_show import RunOfShowSubagent
from src.agents.sub.sponsorship_manager import SponsorshipManagerSubagent

logger = logging.getLogger(__name__)


class EventsDirector(BasePrimaryAgent):
    role_slug = "events_director"
    display_name = "Events Director"
    model = "claude-sonnet-4-6"
    temperature = 0.4

    _SUBAGENT_REGISTRY: dict[str, Any] = {
        "event_planner": EventPlannerSubagent,
        "run_of_show": RunOfShowSubagent,
        "sponsorship_manager": SponsorshipManagerSubagent,
        "post_event_eval": PostEventEvalSubagent,
    }

    _PREAMBLES: dict[str, str] = {
        "event_planner": (
            "Event plan locked in. I've worked backwards from the event date -- "
            "every milestone has a hard deadline. Miss one, and we're scrambling:\n\n"
        ),
        "run_of_show": (
            "Run of show ready. Share this with your full team 48 hours out. "
            "Every time block is intentional -- buffer time is already built in:\n\n"
        ),
        "sponsorship_manager": (
            "Sponsorship materials prepared. "
            "Lead with impact data in every pitch -- sponsors fund outcomes, not events:\n\n"
        ),
        "post_event_eval": (
            "Post-event evaluation complete. "
            "I've flagged what drove the numbers and what to fix before the next one:\n\n"
        ),
    }

    def _should_delegate(self, user_input: str) -> str | None:
        """Return a subagent slug if the request should be delegated, else None.

        Rules
        -----
        - ``run_of_show``         : "run of show", "day-of", or "day of"
        - ``sponsorship_manager`` : "sponsor" or "sponsorship"
        - ``post_event_eval``     : "debrief", "roi", "post-event", or "post event"
        - ``event_planner``       : "event plan", "timeline", "schedule", or
                                    "plan" + ("event"/"gala"/"fundraiser")
        """
        lower = user_input.lower()

        if "run of show" in lower or "day-of" in lower or "day of" in lower:
            logger.debug("Delegating to run_of_show based on keyword match.")
            return "run_of_show"

        if "sponsor" in lower or "sponsorship" in lower:
            logger.debug("Delegating to sponsorship_manager based on keyword match.")
            return "sponsorship_manager"

        if "debrief" in lower or "roi" in lower or "post-event" in lower or "post event" in lower:
            logger.debug("Delegating to post_event_eval based on keyword match.")
            return "post_event_eval"

        if any(sig in lower for sig in ("event plan", "timeline", "schedule")):
            logger.debug("Delegating to event_planner based on keyword match.")
            return "event_planner"

        if "plan" in lower and any(sig in lower for sig in ("event", "gala", "fundraiser")):
            logger.debug("Delegating to event_planner based on keyword match.")
            return "event_planner"

        return None
