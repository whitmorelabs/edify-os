"""CRM update subagent.

Generates CRM update summaries, flags stale records, and suggests next actions.
"""

from __future__ import annotations

from src.agents.sub.base_subagent import BaseSubagent


class CrmUpdateSubagent(BaseSubagent):
    slug = "crm_update"
    display_name = "CRM Update Specialist"
    parent_role = "development_director"
    artifact_type = "crm_summary"
    temperature = 0.2
