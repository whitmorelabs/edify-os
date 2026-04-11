"""Run of show subagent.

Build minute-by-minute event schedules, stage cues, and day-of documents.
"""

from __future__ import annotations

from src.agents.sub.base_subagent import BaseSubagent


class RunOfShowSubagent(BaseSubagent):
    slug = "run_of_show"
    display_name = "Run of Show Specialist"
    parent_role = "events_director"
    artifact_type = "run_of_show_document"
    temperature = 0.25
