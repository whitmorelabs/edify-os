"""Grant reporting subagent.

Draft program sections of grant reports and compile outcome data.
"""

from __future__ import annotations

from src.agents.sub.base_subagent import BaseSubagent


class GrantReportingSubagent(BaseSubagent):
    slug = "grant_reporting"
    display_name = "Grant Reporting Specialist"
    parent_role = "programs_director"
    artifact_type = "program_report"
    temperature = 0.25
