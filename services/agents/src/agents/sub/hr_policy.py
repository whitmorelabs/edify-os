"""HR policy subagent.

Draft handbook sections, workplace policies, and compliance documents.
"""

from __future__ import annotations

from src.agents.sub.base_subagent import BaseSubagent


class HrPolicySubagent(BaseSubagent):
    slug = "hr_policy"
    display_name = "HR Policy Specialist"
    parent_role = "hr_volunteer_coordinator"
    artifact_type = "policy_draft"
    temperature = 0.25
