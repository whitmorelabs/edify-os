"""Grant writing subagent.

Drafts grant document sections using org memory, concrete numbers,
and funder guidelines passed in via instruction context.
"""

from __future__ import annotations

from src.agents.sub.base_subagent import BaseSubagent


class GrantWritingSubagent(BaseSubagent):
    slug = "grant_writing"
    display_name = "Grant Writing Specialist"
    parent_role = "development_director"
    artifact_type = "grant_draft"
    temperature = 0.4
