"""Donor outreach subagent.

Drafts personalized donor emails, thank-you letters, and impact reports.
"""

from __future__ import annotations

from src.agents.sub.base_subagent import BaseSubagent


class DonorOutreachSubagent(BaseSubagent):
    slug = "donor_outreach"
    display_name = "Donor Outreach Specialist"
    parent_role = "development_director"
    artifact_type = "donor_email"
    temperature = 0.4
