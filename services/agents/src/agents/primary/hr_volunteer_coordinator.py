"""HR & Volunteer Coordinator primary agent.

Handles hiring support, volunteer program management, HR policies,
training design, and onboarding for nonprofit organisations.

Delegates focused sub-tasks to specialist subagents via
SubagentDispatcher when the request is a better fit for a subagent
than inline handling.
"""

from __future__ import annotations

import logging
from typing import Any

from src.agents.primary.base_primary import BasePrimaryAgent
from src.agents.sub.hiring_support import HiringSupportSubagent
from src.agents.sub.hr_policy import HrPolicySubagent
from src.agents.sub.training_design import TrainingDesignSubagent
from src.agents.sub.volunteer_management import VolunteerManagementSubagent

logger = logging.getLogger(__name__)


class HRVolunteerCoordinator(BasePrimaryAgent):
    role_slug = "hr_volunteer_coordinator"
    display_name = "HR & Volunteer Coordinator"
    model = "claude-sonnet-4-6"
    temperature = 0.4

    _SUBAGENT_REGISTRY: dict[str, Any] = {
        "volunteer_management": VolunteerManagementSubagent,
        "hr_policy": HrPolicySubagent,
        "hiring_support": HiringSupportSubagent,
        "training_design": TrainingDesignSubagent,
    }

    _PREAMBLES: dict[str, str] = {
        "volunteer_management": (
            "Here's the volunteer program plan I've put together. "
            "I've made sure roles feel meaningful and accessible -- "
            "adjust the commitment asks to match your current capacity:\n\n"
        ),
        "hr_policy": (
            "I've drafted the policy content below. "
            "Please have legal or your HR counsel review before it goes into the handbook:\n\n"
        ),
        "hiring_support": (
            "Here's the hiring support material ready for use. "
            "The language is written to attract mission-aligned candidates -- "
            "customise the requirements section to fit your actual needs:\n\n"
        ),
        "training_design": (
            "Training plan drafted below. "
            "I've structured it to build confidence gradually and create space for questions:\n\n"
        ),
    }

    def _should_delegate(self, user_input: str) -> str | None:
        """Return a subagent slug if the request should be delegated, else None.

        Rules
        -----
        - ``volunteer_management`` : "volunteer" or "volunteer role"
        - ``hr_policy``            : "policy", "handbook", or "workplace"
        - ``hiring_support``       : "hire", "job description", or "interview"
        - ``training_design``      : "training", "onboarding", or "orientation"
        """
        lower = user_input.lower()

        if "volunteer" in lower:
            logger.debug("Delegating to volunteer_management based on keyword match.")
            return "volunteer_management"

        if any(sig in lower for sig in ("policy", "handbook", "workplace")):
            logger.debug("Delegating to hr_policy based on keyword match.")
            return "hr_policy"

        if any(sig in lower for sig in ("hire", "job description", "interview")):
            logger.debug("Delegating to hiring_support based on keyword match.")
            return "hiring_support"

        if any(sig in lower for sig in ("training", "onboarding", "orientation")):
            logger.debug("Delegating to training_design based on keyword match.")
            return "training_design"

        return None
