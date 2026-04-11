"""Social media integrations.

Supports Facebook, Instagram, LinkedIn, and X (Twitter).
Each platform has its own API conventions -- see TODO comments for
platform-specific endpoint details.

Requires a social_<platform> OAuth connection to be active for the org.
Uses httpx for async HTTP calls.
"""

from __future__ import annotations

from typing import Any

import httpx

from .base_integration import BaseIntegration
from .oauth import OAuthTokenManager

# Provider key format used in oauth_connections
_PROVIDER_PREFIX = "social_"

# TODO: Replace placeholder base URLs with real API roots per platform.
_API_ROOTS: dict[str, str] = {
    "facebook": "https://graph.facebook.com/v19.0",  # Meta Graph API
    "instagram": "https://graph.facebook.com/v19.0",  # Instagram via Meta Graph
    "linkedin": "https://api.linkedin.com/v2",        # LinkedIn API v2
    "x": "https://api.twitter.com/2",                 # X (Twitter) API v2
}


class SocialMediaIntegration(BaseIntegration):
    """Post, schedule, and retrieve analytics across social platforms."""

    def __init__(self, token_manager: OAuthTokenManager, platform: str) -> None:
        super().__init__(token_manager)
        if platform not in _API_ROOTS:
            raise ValueError(f"Unsupported platform: {platform!r}. Choose from {list(_API_ROOTS)}")
        self._platform = platform
        self.provider = f"{_PROVIDER_PREFIX}{platform}"

    async def execute(self, action: str, params: dict[str, Any]) -> dict[str, Any]:
        token = await self._tokens.refresh_if_expired(self.provider)
        if not token:
            return {"error": f"{self.provider} integration is not connected for this org"}

        handlers = {
            "post": self._post,
            "schedule_post": self._schedule_post,
            "get_analytics": self._get_analytics,
        }
        handler = handlers.get(action)
        if handler is None:
            return {"error": f"Unknown action: {action!r}. Valid actions: {list(handlers)}"}

        return await handler(token, params)

    async def _post(self, token: str, params: dict[str, Any]) -> dict[str, Any]:
        content = params.get("content", "")
        base = _API_ROOTS[self._platform]

        # TODO: Each platform requires a different endpoint + payload shape.
        # Facebook: POST /me/feed  {"message": content}
        # Instagram: POST /me/media then /me/media_publish
        # LinkedIn:  POST /ugcPosts with UGC schema
        # X:         POST /tweets  {"text": content}
        endpoint, payload = self._build_post_payload(base, content, params)

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    endpoint,
                    headers={"Authorization": f"Bearer {token}"},
                    json=payload,
                    timeout=15,
                )
                resp.raise_for_status()
                return {"posted": True, "platform": self._platform, "response": resp.json()}
        except httpx.HTTPStatusError as exc:
            return {"error": f"{self._platform} API error: {exc.response.status_code}"}
        except httpx.RequestError:
            return {"error": f"Failed to reach {self._platform} API"}

    async def _schedule_post(self, token: str, params: dict[str, Any]) -> dict[str, Any]:
        # TODO: Scheduling support varies per platform.
        # Facebook supports scheduled_publish_time on /me/feed.
        # Instagram, LinkedIn, X require third-party schedulers or their own draft APIs.
        return {
            "scheduled": False,
            "message": (
                f"Native scheduling for {self._platform} is not yet implemented. "
                "Post content returned for manual scheduling."
            ),
            "content": params.get("content"),
            "schedule_time": params.get("schedule_time"),
        }

    async def _get_analytics(self, token: str, params: dict[str, Any]) -> dict[str, Any]:
        # TODO: Each platform exposes analytics via different endpoints and metrics.
        # Facebook: GET /{page-id}/insights
        # Instagram: GET /{media-id}/insights
        # LinkedIn:  GET /organizationalEntityShareStatistics
        # X:         GET /tweets/:id with expansions
        return {
            "analytics": None,
            "message": (
                f"Analytics for {self._platform} are not yet implemented. "
                "Configure the platform-specific insights endpoint."
            ),
        }

    def _build_post_payload(
        self, base: str, content: str, params: dict[str, Any]
    ) -> tuple[str, dict[str, Any]]:
        """Return (endpoint_url, request_body) for the given platform."""
        if self._platform == "facebook":
            return f"{base}/me/feed", {"message": content}
        if self._platform == "instagram":
            # TODO: Two-step publish: create container, then publish.
            return f"{base}/me/media", {"caption": content, "media_type": "IMAGE"}
        if self._platform == "linkedin":
            # TODO: Requires full UGC post schema with author URN.
            return f"{base}/ugcPosts", {"specificContent": {"shareCommentary": {"text": content}}}
        if self._platform == "x":
            return f"{base}/tweets", {"text": content}
        return f"{base}/post", {"content": content}
