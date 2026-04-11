"""OAuth token management for external integrations.

Fetches and refreshes OAuth tokens stored in the `oauth_connections` table.
Never log or expose token values in error messages.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    import asyncpg

SUPPORTED_PROVIDERS = frozenset(
    [
        "google_calendar",
        "gmail",
        "social_facebook",
        "social_instagram",
        "social_linkedin",
        "social_x",
        "grant_databases",
    ]
)


class OAuthTokenManager:
    """Fetches and refreshes OAuth tokens for a given organisation."""

    def __init__(self, db_pool: "asyncpg.Pool", org_id: str) -> None:
        self._pool = db_pool
        self._org_id = org_id

    async def get_token(self, provider: str) -> str | None:
        """Return the current access token for *provider*, or None if not connected."""
        if provider not in SUPPORTED_PROVIDERS:
            raise ValueError(f"Unsupported provider: {provider!r}")

        row = await self._pool.fetchrow(
            """
            SELECT access_token, refresh_token, expires_at
            FROM oauth_connections
            WHERE org_id = $1 AND provider = $2
            LIMIT 1
            """,
            self._org_id,
            provider,
        )
        if row is None:
            return None
        return row["access_token"]

    async def refresh_if_expired(self, provider: str) -> str | None:
        """Return a valid access token, refreshing if the stored one has expired.

        TODO: Implement actual token refresh via each provider's token endpoint.
        For now this returns the existing token regardless of expiry.
        """
        if provider not in SUPPORTED_PROVIDERS:
            raise ValueError(f"Unsupported provider: {provider!r}")

        row = await self._pool.fetchrow(
            """
            SELECT access_token, refresh_token, expires_at
            FROM oauth_connections
            WHERE org_id = $1 AND provider = $2
            LIMIT 1
            """,
            self._org_id,
            provider,
        )
        if row is None:
            return None

        expires_at: datetime | None = row["expires_at"]
        now = datetime.now(timezone.utc)

        if expires_at is not None and expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if expires_at is not None and now >= expires_at:
            # TODO: Call provider token refresh endpoint using row["refresh_token"],
            #       persist the new access_token + expires_at, then return it.
            pass  # Fall through and return current token for now.

        return row["access_token"]
