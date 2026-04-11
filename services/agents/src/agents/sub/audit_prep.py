"""Audit prep subagent.

Generate audit checklists and review internal controls.
"""

from __future__ import annotations

from src.agents.sub.base_subagent import BaseSubagent


class AuditPrepSubagent(BaseSubagent):
    slug = "audit_prep"
    display_name = "Audit Prep Specialist"
    parent_role = "finance_director"
    artifact_type = "audit_checklist"
    temperature = 0.2
