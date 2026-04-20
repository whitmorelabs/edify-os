"""Development Director primary agent.

Handles grant research, donor outreach, fundraising strategy,
prospect identification, and development communications for
nonprofit organisations.

Delegates focused sub-tasks to specialist subagents via
SubagentDispatcher when the request is a better fit for a subagent
than inline handling.
"""

from __future__ import annotations

import logging
from typing import Any

from src.agents.primary.base_primary import BasePrimaryAgent
from src.agents.sub.crm_update import CrmUpdateSubagent
from src.agents.sub.donor_outreach import DonorOutreachSubagent
from src.agents.sub.grant_research import GrantResearchSubagent
from src.agents.sub.grant_writing import GrantWritingSubagent
from src.agents.sub.reporting import ReportingSubagent

logger = logging.getLogger(__name__)


class DevelopmentDirector(BasePrimaryAgent):
    role_slug = "development_director"
    display_name = "Development Director"
    model = "claude-sonnet-4-6"
    temperature = 0.35

    _SUBAGENT_REGISTRY: dict[str, Any] = {
        "grant_research": GrantResearchSubagent,
        "grant_writing": GrantWritingSubagent,
        "donor_outreach": DonorOutreachSubagent,
        "crm_update": CrmUpdateSubagent,
        "reporting": ReportingSubagent,
    }

    _PREAMBLES: dict[str, str] = {
        "grant_research": (
            "Here's what I found after reviewing our grant landscape. "
            "I've ranked opportunities by fit and likelihood:\n\n"
        ),
        "grant_writing": (
            "I've drafted the requested grant content below. "
            "Review for accuracy against funder guidelines and fill in any bracketed placeholders:\n\n"
        ),
        "donor_outreach": (
            "Donor outreach drafted below. "
            "Personalise each message before sending and confirm contact details are current:\n\n"
        ),
        "crm_update": (
            "CRM review complete. "
            "Here are the stale records and recommended next actions:\n\n"
        ),
        "reporting": (
            "Fundraising report ready for review. "
            "Verify all figures against your accounting records before sharing with the board:\n\n"
        ),
    }

    def _should_delegate(self, user_input: str) -> str | None:
        """Return a subagent slug if the request should be delegated, else None.

        Rules
        -----
        - ``grant_writing``  : ("write"/"draft"/"compose"/"prepare") + "grant"
        - ``grant_research`` : ("research"/"find"/"identify"/"search"/"look for"/"list") + "grant"
        - ``donor_outreach`` : "donor"/"outreach"/"thank you"/"stewardship"
        - ``crm_update``     : "crm"/"stale"/"donor record"
        - ``reporting``      : "report"/"dashboard"/"board summary"/"fundraising report"
        """
        lower = user_input.lower()

        if "grant" in lower:
            if any(sig in lower for sig in ("write", "draft", "compose", "prepare")):
                logger.debug("Delegating to grant_writing based on keyword match.")
                return "grant_writing"
            if any(sig in lower for sig in ("research", "find", "identify", "search", "look for", "list")):
                logger.debug("Delegating to grant_research based on keyword match.")
                return "grant_research"

        if any(sig in lower for sig in ("donor", "outreach", "thank you", "stewardship")):
            logger.debug("Delegating to donor_outreach based on keyword match.")
            return "donor_outreach"

        if any(sig in lower for sig in ("crm", "stale", "donor record")):
            logger.debug("Delegating to crm_update based on keyword match.")
            return "crm_update"

        if any(sig in lower for sig in ("report", "dashboard", "board summary", "fundraising report")):
            logger.debug("Delegating to reporting based on keyword match.")
            return "reporting"

        return None
