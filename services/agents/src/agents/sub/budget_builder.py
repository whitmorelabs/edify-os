"""Budget builder subagent.

Create org and program budgets, variance analysis, and budget-to-actual reports.
"""

from __future__ import annotations

from src.agents.sub.base_subagent import BaseSubagent


class BudgetBuilderSubagent(BaseSubagent):
    slug = "budget_builder"
    display_name = "Budget Builder Specialist"
    parent_role = "finance_director"
    artifact_type = "budget_document"
    temperature = 0.2
