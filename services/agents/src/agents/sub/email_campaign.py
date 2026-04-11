"""Email campaign subagent.

Designs email sequences, newsletters, and drip campaigns.
"""

from __future__ import annotations

from src.agents.sub.base_subagent import BaseSubagent


class EmailCampaignSubagent(BaseSubagent):
    slug = "email_campaign"
    display_name = "Email Campaign Specialist"
    parent_role = "marketing_director"
    artifact_type = "email_sequence"
    temperature = 0.4
