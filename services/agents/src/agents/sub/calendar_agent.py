"""Calendar agent subagent.

Handles meeting scheduling, conflict detection, and prep reminders.
"""

from __future__ import annotations

from src.agents.sub.base_subagent import BaseSubagent


class CalendarAgentSubagent(BaseSubagent):
    slug = "calendar_agent"
    display_name = "Calendar Management Specialist"
    parent_role = "executive_assistant"
    artifact_type = "calendar_suggestion"
    temperature = 0.2
