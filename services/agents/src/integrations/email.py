"""Gmail integration.

Requires the gmail OAuth connection to be active for the org.
Uses httpx for async HTTP calls to the Gmail API v1.
"""

from __future__ import annotations

import base64
from email.mime.text import MIMEText
from typing import Any

import httpx

from .base_integration import BaseIntegration
from .oauth import OAuthTokenManager

_GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me"


class EmailIntegration(BaseIntegration):
    """Interact with Gmail on behalf of the organisation."""

    provider = "gmail"

    async def execute(self, action: str, params: dict[str, Any]) -> dict[str, Any]:
        token = await self._tokens.refresh_if_expired(self.provider)
        if not token:
            return {"error": "gmail integration is not connected for this org"}

        handlers = {
            "list_messages": self._list_messages,
            "read_message": self._read_message,
            "send_draft": self._send_draft,
        }
        handler = handlers.get(action)
        if handler is None:
            return {"error": f"Unknown action: {action!r}. Valid actions: {list(handlers)}"}

        return await handler(token, params)

    async def _list_messages(self, token: str, params: dict[str, Any]) -> dict[str, Any]:
        query: dict[str, Any] = {}
        if "q" in params:
            query["q"] = params["q"]
        query["maxResults"] = params.get("max_results", 10)

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{_GMAIL_BASE}/messages",
                    headers={"Authorization": f"Bearer {token}"},
                    params=query,
                    timeout=15,
                )
                resp.raise_for_status()
                data = resp.json()
                messages = data.get("messages", [])
                return {"messages": messages, "count": len(messages)}
        except httpx.HTTPStatusError as exc:
            return {"error": f"Gmail API error: {exc.response.status_code}"}
        except httpx.RequestError:
            return {"error": "Failed to reach Gmail API"}

    async def _read_message(self, token: str, params: dict[str, Any]) -> dict[str, Any]:
        message_id = params.get("message_id")
        if not message_id:
            return {"error": "message_id is required"}

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{_GMAIL_BASE}/messages/{message_id}",
                    headers={"Authorization": f"Bearer {token}"},
                    params={"format": "full"},
                    timeout=15,
                )
                resp.raise_for_status()
                data = resp.json()
                headers = {
                    h["name"]: h["value"]
                    for h in data.get("payload", {}).get("headers", [])
                    if h["name"] in ("From", "To", "Subject", "Date")
                }
                snippet = data.get("snippet", "")
                return {"id": message_id, "headers": headers, "snippet": snippet}
        except httpx.HTTPStatusError as exc:
            return {"error": f"Gmail API error: {exc.response.status_code}"}
        except httpx.RequestError:
            return {"error": "Failed to reach Gmail API"}

    async def _send_draft(self, token: str, params: dict[str, Any]) -> dict[str, Any]:
        """Create and send a draft email."""
        to = params.get("to", "")
        subject = params.get("subject", "")
        body = params.get("body", "")

        mime = MIMEText(body)
        mime["to"] = to
        mime["subject"] = subject
        raw = base64.urlsafe_b64encode(mime.as_bytes()).decode()

        try:
            async with httpx.AsyncClient() as client:
                # Create draft
                draft_resp = await client.post(
                    f"{_GMAIL_BASE}/drafts",
                    headers={"Authorization": f"Bearer {token}"},
                    json={"message": {"raw": raw}},
                    timeout=15,
                )
                draft_resp.raise_for_status()
                draft_id = draft_resp.json().get("id")

                # Send it
                send_resp = await client.post(
                    f"{_GMAIL_BASE}/drafts/send",
                    headers={"Authorization": f"Bearer {token}"},
                    json={"id": draft_id},
                    timeout=15,
                )
                send_resp.raise_for_status()
                return {"sent": True, "message_id": send_resp.json().get("id")}
        except httpx.HTTPStatusError as exc:
            return {"error": f"Gmail API error: {exc.response.status_code}"}
        except httpx.RequestError:
            return {"error": "Failed to reach Gmail API"}
