"""Google Calendar integration.

Requires the google_calendar OAuth connection to be active for the org.
Uses httpx for async HTTP calls to the Google Calendar API v3.
"""

from __future__ import annotations

from typing import Any

import httpx

from .base_integration import BaseIntegration
from .oauth import OAuthTokenManager

_CALENDAR_BASE = "https://www.googleapis.com/calendar/v3"


class CalendarIntegration(BaseIntegration):
    """Interact with Google Calendar on behalf of the organisation."""

    provider = "google_calendar"

    async def execute(self, action: str, params: dict[str, Any]) -> dict[str, Any]:
        token = await self._tokens.refresh_if_expired(self.provider)
        if not token:
            return {"error": "google_calendar integration is not connected for this org"}

        handlers = {
            "list_events": self._list_events,
            "create_event": self._create_event,
            "check_conflicts": self._check_conflicts,
        }
        handler = handlers.get(action)
        if handler is None:
            return {"error": f"Unknown action: {action!r}. Valid actions: {list(handlers)}"}

        return await handler(token, params)

    async def _list_events(self, token: str, params: dict[str, Any]) -> dict[str, Any]:
        calendar_id = params.get("calendar_id", "primary")
        query: dict[str, Any] = {}
        if "time_min" in params:
            query["timeMin"] = params["time_min"]
        if "time_max" in params:
            query["timeMax"] = params["time_max"]
        query.setdefault("singleEvents", "true")
        query.setdefault("orderBy", "startTime")

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{_CALENDAR_BASE}/calendars/{calendar_id}/events",
                    headers={"Authorization": f"Bearer {token}"},
                    params=query,
                    timeout=15,
                )
                resp.raise_for_status()
                data = resp.json()
                events = [
                    {
                        "id": e.get("id"),
                        "summary": e.get("summary"),
                        "start": e.get("start"),
                        "end": e.get("end"),
                        "attendees": [a.get("email") for a in e.get("attendees", [])],
                    }
                    for e in data.get("items", [])
                ]
                return {"events": events, "count": len(events)}
        except httpx.HTTPStatusError as exc:
            return {"error": f"Calendar API error: {exc.response.status_code}"}
        except httpx.RequestError:
            return {"error": "Failed to reach Google Calendar API"}

    async def _create_event(self, token: str, params: dict[str, Any]) -> dict[str, Any]:
        calendar_id = params.get("calendar_id", "primary")
        body: dict[str, Any] = {
            "summary": params.get("title", ""),
            "description": params.get("description", ""),
            "start": params.get("start", {}),
            "end": params.get("end", {}),
        }
        if "attendees" in params:
            body["attendees"] = [{"email": e} for e in params["attendees"]]

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"{_CALENDAR_BASE}/calendars/{calendar_id}/events",
                    headers={"Authorization": f"Bearer {token}"},
                    json=body,
                    timeout=15,
                )
                resp.raise_for_status()
                data = resp.json()
                return {"event_id": data.get("id"), "html_link": data.get("htmlLink")}
        except httpx.HTTPStatusError as exc:
            return {"error": f"Calendar API error: {exc.response.status_code}"}
        except httpx.RequestError:
            return {"error": "Failed to reach Google Calendar API"}

    async def _check_conflicts(self, token: str, params: dict[str, Any]) -> dict[str, Any]:
        """Check for scheduling conflicts against a proposed time slot.

        Params
        ------
        start : str
            ISO 8601 datetime string for the proposed slot start.
        end : str
            ISO 8601 datetime string for the proposed slot end.
        calendar_id : str, optional
            Calendar to check (defaults to "primary").

        An existing event overlaps the proposed slot when:
            event_start < proposed_end  AND  event_end > proposed_start
        """
        proposed_start = params.get("start")
        proposed_end = params.get("end")

        if not proposed_start or not proposed_end:
            return {"error": "start and end params are required for check_conflicts"}

        # Fetch events that overlap the proposed window using Google's timeMin/timeMax
        list_params = {
            "calendar_id": params.get("calendar_id", "primary"),
            "time_min": proposed_start,
            "time_max": proposed_end,
        }
        result = await self._list_events(token, list_params)
        if "error" in result:
            return result

        conflicts = []
        for event in result.get("events", []):
            event_start = (event.get("start") or {}).get("dateTime") or (event.get("start") or {}).get("date")
            event_end = (event.get("end") or {}).get("dateTime") or (event.get("end") or {}).get("date")
            if event_start and event_end:
                # Overlap condition: event_start < proposed_end AND event_end > proposed_start
                if event_start < proposed_end and event_end > proposed_start:
                    conflicts.append(event)

        return {"conflicts": conflicts, "has_conflicts": len(conflicts) > 0}
