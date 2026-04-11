"""Hiring support subagent.

Write job descriptions, design interview processes, and build scoring rubrics.
"""

from __future__ import annotations

from src.agents.sub.base_subagent import BaseSubagent


class HiringSupportSubagent(BaseSubagent):
    slug = "hiring_support"
    display_name = "Hiring Support Specialist"
    parent_role = "hr_volunteer_coordinator"
    artifact_type = "hiring_document"
    temperature = 0.35
