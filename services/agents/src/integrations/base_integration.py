"""Abstract base class for all external service integrations."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from .oauth import OAuthTokenManager


class BaseIntegration(ABC):
    """Common interface for every external integration.

    Subclasses declare a ``provider`` class attribute matching the provider
    string used in ``integrations``, then implement ``execute``.
    """

    provider: str  # Must be overridden by each subclass.

    def __init__(self, token_manager: OAuthTokenManager) -> None:
        self._tokens = token_manager

    @abstractmethod
    async def execute(self, action: str, params: dict[str, Any]) -> dict[str, Any]:
        """Dispatch *action* with *params* and return a structured result dict."""
        ...
