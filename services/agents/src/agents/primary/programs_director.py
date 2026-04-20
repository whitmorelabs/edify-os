"""Programs Director primary agent.

Handles program design, outcome tracking, logic models, grant compliance
reporting, needs assessments, and participant journey planning for
nonprofit organisations.

Delegates focused sub-tasks to specialist subagents via
SubagentDispatcher when the request is a better fit for a subagent
than inline handling.
"""

from __future__ import annotations

import logging
from typing import Any

from src.agents.primary.base_primary import BasePrimaryAgent
from src.agents.sub.compliance_monitor import ComplianceMonitorSubagent
from src.agents.sub.grant_reporting import GrantReportingSubagent
from src.agents.sub.needs_assessment import NeedsAssessmentSubagent
from src.agents.sub.outcome_tracking import OutcomeTrackingSubagent
from src.agents.sub.program_design import ProgramDesignSubagent

logger = logging.getLogger(__name__)


class ProgramsDirector(BasePrimaryAgent):
    role_slug = "programs_director"
    display_name = "Programs Director"
    model = "claude-sonnet-4-6"
    temperature = 0.35

    _SUBAGENT_REGISTRY: dict[str, Any] = {
        "program_design": ProgramDesignSubagent,
        "outcome_tracking": OutcomeTrackingSubagent,
        "grant_reporting": GrantReportingSubagent,
        "needs_assessment": NeedsAssessmentSubagent,
        "compliance_monitor": ComplianceMonitorSubagent,
    }

    _PREAMBLES: dict[str, str] = {
        "program_design": (
            "Here's the program design framework I've developed. "
            "Review each component against your current participant data and funder requirements:\n\n"
        ),
        "outcome_tracking": (
            "I've built out the outcome tracking structure below. "
            "These indicators connect directly to participant journeys and funder expectations:\n\n"
        ),
        "grant_reporting": (
            "I've prepared the grant report content for your review. "
            "Confirm all data points against your actual program records before submitting:\n\n"
        ),
        "needs_assessment": (
            "Here's the needs assessment summary. "
            "I've grounded this in participant voice and evidence where available:\n\n"
        ),
        "compliance_monitor": (
            "I've reviewed your compliance obligations and deadlines. "
            "Here's what needs attention and in what order:\n\n"
        ),
    }

    def _should_delegate(self, user_input: str) -> str | None:
        """Return a subagent slug if the request should be delegated, else None.

        Rules
        -----
        - ``program_design``     : "logic model" or "theory of change"
        - ``outcome_tracking``   : "outcome", "metric", or "data"
        - ``grant_reporting``    : "grant report" or "funder report"
        - ``needs_assessment``   : "needs assessment" or "gap analysis"
        - ``compliance_monitor`` : "deliverable", "compliance", or "deadline"
        """
        lower = user_input.lower()

        if "logic model" in lower or "theory of change" in lower:
            logger.debug("Delegating to program_design based on keyword match.")
            return "program_design"

        if any(sig in lower for sig in ("outcome", "metric", "data")):
            logger.debug("Delegating to outcome_tracking based on keyword match.")
            return "outcome_tracking"

        if "grant report" in lower or "funder report" in lower:
            logger.debug("Delegating to grant_reporting based on keyword match.")
            return "grant_reporting"

        if "needs assessment" in lower or "gap analysis" in lower:
            logger.debug("Delegating to needs_assessment based on keyword match.")
            return "needs_assessment"

        if any(sig in lower for sig in ("deliverable", "compliance", "deadline")):
            logger.debug("Delegating to compliance_monitor based on keyword match.")
            return "compliance_monitor"

        return None
