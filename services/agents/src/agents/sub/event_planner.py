"""Event planner subagent.

Create comprehensive event plans with timelines, budgets, and vendor lists.
"""

from __future__ import annotations

from src.agents.sub.base_subagent import BaseSubagent


class EventPlannerSubagent(BaseSubagent):
    slug = "event_planner"
    display_name = "Event Planner Specialist"
    parent_role = "events_director"
    artifact_type = "event_plan"
    temperature = 0.35
