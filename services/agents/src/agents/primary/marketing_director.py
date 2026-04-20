"""Marketing Director primary agent.

Handles social media management, email campaigns, content creation,
brand messaging, and communications strategy for nonprofit organisations.

Delegates focused sub-tasks to specialist subagents via
SubagentDispatcher when the request is a better fit for a subagent
than inline handling.
"""

from __future__ import annotations

import logging
from typing import Any

from src.agents.primary.base_primary import BasePrimaryAgent
from src.agents.sub.analytics import AnalyticsSubagent
from src.agents.sub.comms_strategy import CommsStrategySubagent
from src.agents.sub.content_writing import ContentWritingSubagent
from src.agents.sub.email_campaign import EmailCampaignSubagent
from src.agents.sub.social_media import SocialMediaSubagent

logger = logging.getLogger(__name__)


class MarketingDirector(BasePrimaryAgent):
    role_slug = "marketing_director"
    display_name = "Marketing Director"
    model = "claude-sonnet-4-6"
    temperature = 0.5  # slightly more creative for marketing content

    _SUBAGENT_REGISTRY: dict[str, Any] = {
        "social_media": SocialMediaSubagent,
        "email_campaign": EmailCampaignSubagent,
        "content_writing": ContentWritingSubagent,
        "comms_strategy": CommsStrategySubagent,
        "analytics": AnalyticsSubagent,
    }

    _PREAMBLES: dict[str, str] = {
        "social_media": (
            "Here's the social media content ready to go. "
            "Adjust the tone and platform-specific details before scheduling:\n\n"
        ),
        "email_campaign": (
            "Email campaign drafted below. "
            "Review subject lines and CTAs against your audience segments before sending:\n\n"
        ),
        "content_writing": (
            "Content piece drafted and ready for review. "
            "Check for accuracy and make sure the voice aligns with your brand guidelines:\n\n"
        ),
        "comms_strategy": (
            "Communications strategy and planning framework below. "
            "Align this with your team's capacity and upcoming program milestones:\n\n"
        ),
        "analytics": (
            "Analytics review complete. "
            "I've highlighted what's working and where to focus optimisation efforts:\n\n"
        ),
    }

    def _should_delegate(self, user_input: str) -> str | None:
        """Return a subagent slug if the request should be delegated, else None.

        Rules
        -----
        - ``social_media``   : "social media", "post", "instagram", or "linkedin"
        - ``email_campaign`` : "email", "newsletter", or "drip"
        - ``content_writing``: "blog", "press release", or "case study"
        - ``comms_strategy`` : "content calendar", "messaging", or "communication plan"
        - ``analytics``      : "analytics", "metrics", "performance", or "campaign report"
        """
        lower = user_input.lower()

        if any(sig in lower for sig in ("social media", "post", "instagram", "linkedin")):
            logger.debug("Delegating to social_media based on keyword match.")
            return "social_media"

        if any(sig in lower for sig in ("email", "newsletter", "drip")):
            logger.debug("Delegating to email_campaign based on keyword match.")
            return "email_campaign"

        if any(sig in lower for sig in ("blog", "press release", "case study")):
            logger.debug("Delegating to content_writing based on keyword match.")
            return "content_writing"

        if any(sig in lower for sig in ("content calendar", "messaging", "communication plan")):
            logger.debug("Delegating to comms_strategy based on keyword match.")
            return "comms_strategy"

        if any(sig in lower for sig in ("analytics", "metrics", "performance", "campaign report")):
            logger.debug("Delegating to analytics based on keyword match.")
            return "analytics"

        return None
