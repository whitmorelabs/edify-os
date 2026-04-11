"""Meeting prep subagent.

Creates agendas, pulls relevant documents, and produces briefing notes.
"""

from __future__ import annotations

from src.agents.sub.base_subagent import BaseSubagent


class MeetingPrepSubagent(BaseSubagent):
    slug = "meeting_prep"
    display_name = "Meeting Preparation Specialist"
    parent_role = "executive_assistant"
    artifact_type = "meeting_agenda"
    temperature = 0.3
