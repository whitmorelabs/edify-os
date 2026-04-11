"""Edify OS integration layer.

Exports all integration classes for convenient top-level imports.
"""

from __future__ import annotations

from src.integrations.base_integration import BaseIntegration
from src.integrations.calendar import CalendarIntegration
from src.integrations.email import EmailIntegration
from src.integrations.grants import GrantDatabaseIntegration
from src.integrations.oauth import OAuthTokenManager
from src.integrations.social import SocialMediaIntegration

__all__ = [
    "BaseIntegration",
    "CalendarIntegration",
    "EmailIntegration",
    "GrantDatabaseIntegration",
    "OAuthTokenManager",
    "SocialMediaIntegration",
]
