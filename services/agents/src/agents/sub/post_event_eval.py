"""Post-event evaluation subagent.

Design attendee surveys, calculate event ROI, and produce debrief reports.
"""

from __future__ import annotations

from src.agents.sub.base_subagent import BaseSubagent


class PostEventEvalSubagent(BaseSubagent):
    slug = "post_event_eval"
    display_name = "Post-Event Evaluation Specialist"
    parent_role = "events_director"
    artifact_type = "event_evaluation"
    temperature = 0.25
