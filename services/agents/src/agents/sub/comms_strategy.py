"""Communications strategy subagent.

Builds communication plans, messaging matrices, and content calendars.
"""

from __future__ import annotations

from src.agents.sub.base_subagent import BaseSubagent


class CommsStrategySubagent(BaseSubagent):
    slug = "comms_strategy"
    display_name = "Communications Strategy Specialist"
    parent_role = "marketing_director"
    artifact_type = "comms_plan"
    temperature = 0.3
