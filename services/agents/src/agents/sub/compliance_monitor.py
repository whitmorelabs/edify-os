"""Compliance monitor subagent.

Track funder requirements, reporting deadlines, and grant deliverables.
"""

from __future__ import annotations

from src.agents.sub.base_subagent import BaseSubagent


class ComplianceMonitorSubagent(BaseSubagent):
    slug = "compliance_monitor"
    display_name = "Compliance Monitor Specialist"
    parent_role = "programs_director"
    artifact_type = "compliance_checklist"
    temperature = 0.2
