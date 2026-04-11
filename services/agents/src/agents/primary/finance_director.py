"""Finance Director primary agent.

Handles budgeting, cash flow forecasting, grant financial reporting,
audit readiness, and internal controls for nonprofit organisations.

Delegates focused sub-tasks to specialist subagents via
SubagentDispatcher when the request is a better fit for a subagent
than inline handling.
"""

from __future__ import annotations

import logging
from typing import Any

from src.agents.primary.base_primary import BasePrimaryAgent
from src.agents.sub.audit_prep import AuditPrepSubagent
from src.agents.sub.budget_builder import BudgetBuilderSubagent
from src.agents.sub.cash_flow_forecast import CashFlowForecastSubagent
from src.agents.sub.grant_financial_report import GrantFinancialReportSubagent

logger = logging.getLogger(__name__)


class FinanceDirector(BasePrimaryAgent):
    role_slug = "finance_director"
    display_name = "Finance Director"
    model = "claude-sonnet-4-20250514"
    temperature = 0.25

    _SUBAGENT_REGISTRY: dict[str, Any] = {
        "budget_builder": BudgetBuilderSubagent,
        "cash_flow_forecast": CashFlowForecastSubagent,
        "grant_financial_report": GrantFinancialReportSubagent,
        "audit_prep": AuditPrepSubagent,
    }

    _PREAMBLES: dict[str, str] = {
        "budget_builder": (
            "Budget analysis complete. "
            "Review line items against actuals and flag any variances before presenting to the board:\n\n"
        ),
        "cash_flow_forecast": (
            "Cash flow projection prepared below. "
            "Assumptions are noted -- adjust the timeline inputs if your receivables schedule differs:\n\n"
        ),
        "grant_financial_report": (
            "Grant financial report drafted. "
            "Cross-reference every figure against your accounting system before submission:\n\n"
        ),
        "audit_prep": (
            "Audit readiness review complete. "
            "Items are prioritised by risk level. Address high-priority findings first:\n\n"
        ),
    }

    def _should_delegate(self, user_input: str) -> str | None:
        """Return a subagent slug if the request should be delegated, else None.

        Rules
        -----
        - ``budget_builder``         : "budget"
        - ``cash_flow_forecast``     : "cash flow" or "runway"
        - ``grant_financial_report`` : "grant financial" or "spending report"
        - ``audit_prep``             : "audit" or "internal controls"
        """
        lower = user_input.lower()

        if "budget" in lower:
            logger.debug("Delegating to budget_builder based on keyword match.")
            return "budget_builder"

        if "cash flow" in lower or "runway" in lower:
            logger.debug("Delegating to cash_flow_forecast based on keyword match.")
            return "cash_flow_forecast"

        if "grant financial" in lower or "spending report" in lower:
            logger.debug("Delegating to grant_financial_report based on keyword match.")
            return "grant_financial_report"

        if "audit" in lower or "internal controls" in lower:
            logger.debug("Delegating to audit_prep based on keyword match.")
            return "audit_prep"

        return None
