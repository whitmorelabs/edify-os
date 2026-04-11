"""Grant research subagent.

Searches org memory for matching grant opportunities and returns a
ranked list with eligibility notes.
"""

from __future__ import annotations

from src.agents.sub.base_subagent import BaseSubagent


class GrantResearchSubagent(BaseSubagent):
    slug = "grant_research"
    display_name = "Grant Research Specialist"
    parent_role = "development_director"
    artifact_type = "ranked_grant_list"
    temperature = 0.2
