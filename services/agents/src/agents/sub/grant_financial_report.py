"""Grant financial report subagent.

Prepare financial sections of grant reports and track spending by grant.
"""

from __future__ import annotations

from src.agents.sub.base_subagent import BaseSubagent


class GrantFinancialReportSubagent(BaseSubagent):
    slug = "grant_financial_report"
    display_name = "Grant Financial Report Specialist"
    parent_role = "finance_director"
    artifact_type = "financial_report"
    temperature = 0.2
