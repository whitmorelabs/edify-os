"""Volunteer management subagent.

Create volunteer role descriptions, onboarding plans, and recognition programs.
"""

from __future__ import annotations

from src.agents.sub.base_subagent import BaseSubagent


class VolunteerManagementSubagent(BaseSubagent):
    slug = "volunteer_management"
    display_name = "Volunteer Management Specialist"
    parent_role = "hr_volunteer_coordinator"
    artifact_type = "volunteer_document"
    temperature = 0.4
