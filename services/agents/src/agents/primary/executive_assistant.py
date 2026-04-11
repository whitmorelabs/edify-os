"""Executive Assistant primary agent.

Handles email triage, calendar management, meeting preparation,
task management, and general administrative requests for
nonprofit organisations.

Delegates focused sub-tasks to specialist subagents via
SubagentDispatcher when the request is a better fit for a subagent
than inline handling.
"""

from __future__ import annotations

import logging
from typing import Any

from src.agents.primary.base_primary import BasePrimaryAgent
from src.agents.sub.calendar_agent import CalendarAgentSubagent
from src.agents.sub.email_triage import EmailTriageSubagent
from src.agents.sub.meeting_prep import MeetingPrepSubagent
from src.agents.sub.task_management import TaskManagementSubagent

logger = logging.getLogger(__name__)


class ExecutiveAssistant(BasePrimaryAgent):
    role_slug = "executive_assistant"
    display_name = "Executive Assistant"
    model = "claude-sonnet-4-20250514"
    temperature = 0.3

    _SUBAGENT_REGISTRY: dict[str, Any] = {
        "email_triage": EmailTriageSubagent,
        "calendar_agent": CalendarAgentSubagent,
        "meeting_prep": MeetingPrepSubagent,
        "task_management": TaskManagementSubagent,
    }

    _PREAMBLES: dict[str, str] = {
        "email_triage": (
            "Inbox triage complete. "
            "I've sorted by urgency and drafted responses where needed -- "
            "review before sending:\n\n"
        ),
        "calendar_agent": (
            "Scheduling analysis done. "
            "Here are the options and my recommendation -- confirm before sending invites:\n\n"
        ),
        "meeting_prep": (
            "Meeting prep materials ready. "
            "Review the agenda and briefing notes before the call:\n\n"
        ),
        "task_management": (
            "Task list organised and prioritised. "
            "I've flagged what needs attention today versus what can wait:\n\n"
        ),
    }

    def _should_delegate(self, user_input: str) -> str | None:
        """Return a subagent slug if the request should be delegated, else None.

        Rules
        -----
        - ``email_triage``    : "email", "inbox", or "triage"
        - ``calendar_agent``  : "schedule", "calendar", or "meeting time"
        - ``meeting_prep``    : "agenda", "briefing", or "prep"
        - ``task_management`` : "action items", "tasks", "track", or "remind"
        """
        lower = user_input.lower()

        if any(sig in lower for sig in ("email", "inbox", "triage")):
            logger.debug("Delegating to email_triage based on keyword match.")
            return "email_triage"

        if any(sig in lower for sig in ("schedule", "calendar", "meeting time")):
            logger.debug("Delegating to calendar_agent based on keyword match.")
            return "calendar_agent"

        if any(sig in lower for sig in ("agenda", "briefing", "prep")):
            logger.debug("Delegating to meeting_prep based on keyword match.")
            return "meeting_prep"

        if any(sig in lower for sig in ("action items", "tasks", "track", "remind")):
            logger.debug("Delegating to task_management based on keyword match.")
            return "task_management"

        return None
