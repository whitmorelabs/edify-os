"""Email triage subagent.

Categorizes and prioritizes incoming communications, and drafts responses.
"""

from __future__ import annotations

from src.agents.sub.base_subagent import BaseSubagent


class EmailTriageSubagent(BaseSubagent):
    slug = "email_triage"
    display_name = "Email Triage Specialist"
    parent_role = "executive_assistant"
    artifact_type = "email_triage_result"
    temperature = 0.25
