"""Reporting subagent.

Creates fundraising reports, dashboards, and board summaries.
"""

from __future__ import annotations

from src.agents.sub.base_subagent import BaseSubagent


class ReportingSubagent(BaseSubagent):
    slug = "reporting"
    display_name = "Fundraising Reporting Specialist"
    parent_role = "development_director"
    artifact_type = "fundraising_report"
    temperature = 0.25
