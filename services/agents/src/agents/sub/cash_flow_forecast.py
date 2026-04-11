"""Cash flow forecast subagent.

Project cash position over 30/60/90 days and flag potential shortfalls.
"""

from __future__ import annotations

from src.agents.sub.base_subagent import BaseSubagent


class CashFlowForecastSubagent(BaseSubagent):
    slug = "cash_flow_forecast"
    display_name = "Cash Flow Forecast Specialist"
    parent_role = "finance_director"
    artifact_type = "cash_flow_projection"
    temperature = 0.2
