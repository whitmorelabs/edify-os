"""Analytics subagent.

Analyzes campaign performance data and suggests optimizations.
"""

from __future__ import annotations

from src.agents.sub.base_subagent import BaseSubagent


class AnalyticsSubagent(BaseSubagent):
    slug = "analytics"
    display_name = "Campaign Analytics Specialist"
    parent_role = "marketing_director"
    artifact_type = "campaign_analysis"
    temperature = 0.2
