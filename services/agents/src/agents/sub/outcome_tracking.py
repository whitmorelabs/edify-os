"""Outcome tracking subagent.

Create data collection instruments and analyze outcome data.
"""

from __future__ import annotations

from src.agents.sub.base_subagent import BaseSubagent


class OutcomeTrackingSubagent(BaseSubagent):
    slug = "outcome_tracking"
    display_name = "Outcome Tracking Specialist"
    parent_role = "programs_director"
    artifact_type = "outcome_dashboard"
    temperature = 0.2
