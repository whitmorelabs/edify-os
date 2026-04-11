"""Sponsorship manager subagent.

Develop sponsorship packages, prospectuses, and outreach strategies.
"""

from __future__ import annotations

from src.agents.sub.base_subagent import BaseSubagent


class SponsorshipManagerSubagent(BaseSubagent):
    slug = "sponsorship_manager"
    display_name = "Sponsorship Manager Specialist"
    parent_role = "events_director"
    artifact_type = "sponsorship_package"
    temperature = 0.35
