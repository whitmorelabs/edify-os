/**
 * Typed REST wrappers for Google Calendar v3 API.
 * Uses direct fetch — no googleapis SDK (removed in Phase 2a /simplify for bundle size).
 * All functions accept a decrypted accessToken string (obtained via getValidGoogleAccessToken).
 */

const CALENDAR_BASE = "https://www.googleapis.com/calendar/v3";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CalendarEvent = {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  location?: string;
  attendees?: { email: string; responseStatus?: string }[];
  htmlLink?: string;
};

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class GoogleCalendarError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "GoogleCalendarError";
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function authHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    // 204 No Content (delete) has no body
    if (response.status === 204) return {} as T;
    return response.json() as Promise<T>;
  }
  let message = response.statusText;
  try {
    const body = await response.json();
    if (body?.error?.message) message = body.error.message;
  } catch {
    // ignore parse errors — use statusText
  }
  throw new GoogleCalendarError(response.status, message);
}

// ---------------------------------------------------------------------------
// Calendar API functions
// ---------------------------------------------------------------------------

/**
 * List events from a calendar.
 * Defaults: singleEvents=true (flattens recurrences), orderBy=startTime, maxResults=25.
 */
export async function listEvents({
  accessToken,
  calendarId = "primary",
  timeMin,
  timeMax,
  maxResults = 25,
}: {
  accessToken: string;
  calendarId?: string;
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
}): Promise<{ events: CalendarEvent[] }> {
  const params = new URLSearchParams({
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: String(Math.min(Math.max(1, maxResults), 50)),
  });
  if (timeMin) params.set("timeMin", timeMin);
  if (timeMax) params.set("timeMax", timeMax);

  const url = `${CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`;
  const response = await fetch(url, { headers: authHeaders(accessToken) });
  const data = await handleResponse<{ items?: CalendarEvent[] }>(response);
  return { events: data.items ?? [] };
}

/**
 * Get a single event by ID.
 */
export async function getEvent({
  accessToken,
  calendarId = "primary",
  eventId,
}: {
  accessToken: string;
  calendarId?: string;
  eventId: string;
}): Promise<{ event: CalendarEvent }> {
  const url = `${CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;
  const response = await fetch(url, { headers: authHeaders(accessToken) });
  const event = await handleResponse<CalendarEvent>(response);
  return { event };
}

/**
 * Create a new calendar event.
 */
export async function createEvent({
  accessToken,
  calendarId = "primary",
  summary,
  start,
  end,
  description,
  attendees,
  location,
}: {
  accessToken: string;
  calendarId?: string;
  summary: string;
  start: CalendarEvent["start"];
  end: CalendarEvent["end"];
  description?: string;
  attendees?: { email: string }[];
  location?: string;
}): Promise<{ event: CalendarEvent }> {
  const url = `${CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events`;
  const body: Partial<CalendarEvent> = { summary, start, end };
  if (description) body.description = description;
  if (attendees) body.attendees = attendees;
  if (location) body.location = location;

  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify(body),
  });
  const event = await handleResponse<CalendarEvent>(response);
  return { event };
}

/**
 * Update (patch) an existing calendar event.
 */
export async function updateEvent({
  accessToken,
  calendarId = "primary",
  eventId,
  summary,
  start,
  end,
  description,
  attendees,
  location,
}: {
  accessToken: string;
  calendarId?: string;
  eventId: string;
  summary?: string;
  start?: CalendarEvent["start"];
  end?: CalendarEvent["end"];
  description?: string;
  attendees?: { email: string }[];
  location?: string;
}): Promise<{ event: CalendarEvent }> {
  const url = `${CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;
  const body: Partial<CalendarEvent> = {};
  if (summary !== undefined) body.summary = summary;
  if (start !== undefined) body.start = start;
  if (end !== undefined) body.end = end;
  if (description !== undefined) body.description = description;
  if (attendees !== undefined) body.attendees = attendees;
  if (location !== undefined) body.location = location;

  const response = await fetch(url, {
    method: "PATCH",
    headers: authHeaders(accessToken),
    body: JSON.stringify(body),
  });
  const event = await handleResponse<CalendarEvent>(response);
  return { event };
}

/**
 * Delete a calendar event.
 */
export async function deleteEvent({
  accessToken,
  calendarId = "primary",
  eventId,
}: {
  accessToken: string;
  calendarId?: string;
  eventId: string;
}): Promise<{ success: boolean }> {
  const url = `${CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: authHeaders(accessToken),
  });
  await handleResponse<Record<string, never>>(response);
  return { success: true };
}
