"""Needs assessment subagent.

Design and analyze community needs assessments and gap analyses.
"""

from __future__ import annotations

from src.agents.sub.base_subagent import BaseSubagent


class NeedsAssessmentSubagent(BaseSubagent):
    slug = "needs_assessment"
    display_name = "Needs Assessment Specialist"
    parent_role = "programs_director"
    artifact_type = "needs_analysis"
    temperature = 0.3
