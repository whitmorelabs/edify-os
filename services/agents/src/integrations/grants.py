"""Grant database integration.

Searches external grant databases for funding opportunities.
Real grant DB APIs vary by provider -- see TODO comments for
provider-specific endpoint details.

Requires the grant_databases OAuth connection to be active for the org.
Uses httpx for async HTTP calls.
"""

from __future__ import annotations

from typing import Any

import httpx

from .base_integration import BaseIntegration
from .oauth import OAuthTokenManager

# TODO: Replace with the real grant database API base URL once a provider is chosen.
# Common providers: Grants.gov (free, no OAuth), Candid/Foundation Directory,
# Instrumentl, GrantStation.
_GRANT_API_BASE = "https://api.grants-provider.example.com/v1"


class GrantDatabaseIntegration(BaseIntegration):
    """Search and evaluate grant opportunities from external databases."""

    provider = "grant_databases"

    async def execute(self, action: str, params: dict[str, Any]) -> dict[str, Any]:
        token = await self._tokens.refresh_if_expired(self.provider)
        if not token:
            return {"error": "grant_databases integration is not connected for this org"}

        handlers = {
            "search": self._search,
            "get_details": self._get_details,
            "check_eligibility": self._check_eligibility,
        }
        handler = handlers.get(action)
        if handler is None:
            return {"error": f"Unknown action: {action!r}. Valid actions: {list(handlers)}"}

        return await handler(token, params)

    async def _search(self, token: str, params: dict[str, Any]) -> dict[str, Any]:
        query: dict[str, Any] = {}
        if "keywords" in params:
            query["q"] = params["keywords"]
        if "amount_min" in params:
            query["amount_min"] = params["amount_min"]
        if "amount_max" in params:
            query["amount_max"] = params["amount_max"]
        if "deadline_before" in params:
            query["deadline_before"] = params["deadline_before"]
        if "location" in params:
            query["location"] = params["location"]
        query.setdefault("limit", params.get("limit", 20))

        # TODO: Replace endpoint path with the real grant provider's search route.
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{_GRANT_API_BASE}/grants/search",
                    headers={"Authorization": f"Bearer {token}"},
                    params=query,
                    timeout=20,
                )
                resp.raise_for_status()
                data = resp.json()
                grants = data.get("grants", data.get("results", []))
                return {"grants": grants, "count": len(grants)}
        except httpx.HTTPStatusError as exc:
            return {"error": f"Grant database API error: {exc.response.status_code}"}
        except httpx.RequestError:
            return {"error": "Failed to reach grant database API"}

    async def _get_details(self, token: str, params: dict[str, Any]) -> dict[str, Any]:
        grant_id = params.get("grant_id")
        if not grant_id:
            return {"error": "grant_id is required"}

        # TODO: Replace endpoint path with the real grant provider's detail route.
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{_GRANT_API_BASE}/grants/{grant_id}",
                    headers={"Authorization": f"Bearer {token}"},
                    timeout=15,
                )
                resp.raise_for_status()
                return {"grant": resp.json()}
        except httpx.HTTPStatusError as exc:
            return {"error": f"Grant database API error: {exc.response.status_code}"}
        except httpx.RequestError:
            return {"error": "Failed to reach grant database API"}

    async def _check_eligibility(self, token: str, params: dict[str, Any]) -> dict[str, Any]:
        grant_id = params.get("grant_id")
        org_profile = params.get("org_profile", {})

        if not grant_id:
            return {"error": "grant_id is required"}

        # TODO: Replace with real eligibility check endpoint.
        # Some providers support a POST /grants/{id}/eligibility with org profile data.
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"{_GRANT_API_BASE}/grants/{grant_id}/eligibility",
                    headers={"Authorization": f"Bearer {token}"},
                    json={"org_profile": org_profile},
                    timeout=15,
                )
                resp.raise_for_status()
                data = resp.json()
                return {
                    "grant_id": grant_id,
                    "eligible": data.get("eligible"),
                    "reasons": data.get("reasons", []),
                }
        except httpx.HTTPStatusError as exc:
            return {"error": f"Grant database API error: {exc.response.status_code}"}
        except httpx.RequestError:
            return {"error": "Failed to reach grant database API"}
