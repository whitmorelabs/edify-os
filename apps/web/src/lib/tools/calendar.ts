/**
 * Anthropic tool definitions and executor for Google Calendar.
 * These are the 5 tools exposed to Claude for calendar operations.
 * Tool descriptions are written as model-facing prompt engineering.
 */

import type Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------------
// System-prompt addendum for archetypes that have calendar tools active.
// Kept here so it stays co-located with the tool definitions it describes.
// ---------------------------------------------------------------------------

export const CALENDAR_TOOLS_ADDENDUM = `\nYou have access to the user's Google Calendar via tools. Always use them when the user asks about calendar events, scheduling, or availability. Never make up event details — if you don't know, call calendar_list_events or calendar_get_event. Times in your responses should match the timezone the user used in their question.`;
import {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  GoogleCalendarError,
} from "@/lib/google-calendar";

// ---------------------------------------------------------------------------
// Tool definitions (model-facing)
// ---------------------------------------------------------------------------

export const calendarTools: Anthropic.Tool[] = [
  {
    name: "calendar_list_events",
    description:
      "List events from the user's primary Google Calendar. Use this when the user asks about their schedule, upcoming meetings, what's on their calendar, whether they're free or busy, or any question about calendar events. Returns events between optional timeMin and timeMax (ISO 8601). Defaults to the next 7 days. Always call this before claiming the calendar is empty.",
    input_schema: {
      type: "object" as const,
      properties: {
        timeMin: {
          type: "string",
          description:
            "ISO 8601 start of the date range (e.g. '2026-04-18T00:00:00Z'). Defaults to now if omitted.",
        },
        timeMax: {
          type: "string",
          description:
            "ISO 8601 end of the date range (e.g. '2026-04-25T23:59:59Z'). Defaults to 7 days from now if omitted.",
        },
        maxResults: {
          type: "number",
          description:
            "Maximum number of events to return (1–50). Defaults to 25.",
        },
        calendarId: {
          type: "string",
          description:
            "Calendar ID to query. Defaults to 'primary' (the user's main calendar).",
        },
      },
      required: [],
    },
  },
  {
    name: "calendar_get_event",
    description:
      "Fetch full details of a specific Google Calendar event by its ID. Use this when you have an event ID (from a previous calendar_list_events call) and need complete details like attendees, description, or exact times. Do not guess event IDs — only use IDs returned from calendar_list_events.",
    input_schema: {
      type: "object" as const,
      properties: {
        eventId: {
          type: "string",
          description: "The Google Calendar event ID to retrieve.",
        },
        calendarId: {
          type: "string",
          description:
            "Calendar ID. Defaults to 'primary'.",
        },
      },
      required: ["eventId"],
    },
  },
  {
    name: "calendar_create_event",
    description:
      "Create a new event on the user's Google Calendar. Use when the user asks to schedule a meeting, add an event, block time, or create a calendar entry. Always confirm the date, time, and title before creating. Use ISO 8601 with timezone offset for start/end times (e.g. '2026-04-18T14:00:00-04:00'). For all-day events, use 'date' instead of 'dateTime'.",
    input_schema: {
      type: "object" as const,
      properties: {
        summary: {
          type: "string",
          description: "Event title/summary.",
        },
        start: {
          type: "object",
          description:
            "Event start. Use { dateTime: 'ISO 8601 string', timeZone: 'America/New_York' } for timed events, or { date: 'YYYY-MM-DD' } for all-day events.",
          properties: {
            dateTime: { type: "string" },
            date: { type: "string" },
            timeZone: { type: "string" },
          },
        },
        end: {
          type: "object",
          description:
            "Event end. Same format as start. For a 1-hour meeting, end is 1 hour after start.",
          properties: {
            dateTime: { type: "string" },
            date: { type: "string" },
            timeZone: { type: "string" },
          },
        },
        description: {
          type: "string",
          description: "Optional event description or notes.",
        },
        location: {
          type: "string",
          description: "Optional location (address, room, or video link).",
        },
        attendees: {
          type: "array",
          description: "Optional list of attendee email addresses.",
          items: {
            type: "object",
            properties: {
              email: { type: "string" },
            },
            required: ["email"],
          },
        },
        calendarId: {
          type: "string",
          description: "Calendar ID. Defaults to 'primary'.",
        },
      },
      required: ["summary", "start", "end"],
    },
  },
  {
    name: "calendar_update_event",
    description:
      "Update (patch) an existing Google Calendar event. Use when the user wants to reschedule, rename, add attendees, or change details of an event. You must have the event ID — call calendar_list_events or calendar_get_event first if you don't. Only include the fields you want to change; omit unchanged fields.",
    input_schema: {
      type: "object" as const,
      properties: {
        eventId: {
          type: "string",
          description: "The Google Calendar event ID to update.",
        },
        summary: {
          type: "string",
          description: "New event title/summary (optional).",
        },
        start: {
          type: "object",
          description: "New event start time (optional).",
          properties: {
            dateTime: { type: "string" },
            date: { type: "string" },
            timeZone: { type: "string" },
          },
        },
        end: {
          type: "object",
          description: "New event end time (optional).",
          properties: {
            dateTime: { type: "string" },
            date: { type: "string" },
            timeZone: { type: "string" },
          },
        },
        description: {
          type: "string",
          description: "New event description (optional).",
        },
        location: {
          type: "string",
          description: "New event location (optional).",
        },
        attendees: {
          type: "array",
          description:
            "New attendee list (optional). Note: replaces the existing list.",
          items: {
            type: "object",
            properties: {
              email: { type: "string" },
            },
            required: ["email"],
          },
        },
        calendarId: {
          type: "string",
          description: "Calendar ID. Defaults to 'primary'.",
        },
      },
      required: ["eventId"],
    },
  },
  {
    name: "calendar_delete_event",
    description:
      "Delete a Google Calendar event by ID. Use only when the user explicitly asks to delete, cancel, or remove an event. Always confirm which event the user wants to delete before calling this — it cannot be undone. You must have the event ID from a previous calendar_list_events or calendar_get_event call.",
    input_schema: {
      type: "object" as const,
      properties: {
        eventId: {
          type: "string",
          description: "The Google Calendar event ID to delete.",
        },
        calendarId: {
          type: "string",
          description: "Calendar ID. Defaults to 'primary'.",
        },
      },
      required: ["eventId"],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool executor
// ---------------------------------------------------------------------------

export async function executeCalendarTool({
  name,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input,
  accessToken,
}: {
  name: string;
  input: Record<string, unknown>;
  accessToken: string;
}): Promise<{ content: string; is_error?: boolean }> {
  try {
    switch (name) {
      case "calendar_list_events": {
        const result = await listEvents({
          accessToken,
          calendarId: (input.calendarId as string | undefined) ?? "primary",
          timeMin: input.timeMin as string | undefined,
          timeMax: input.timeMax as string | undefined,
          maxResults:
            typeof input.maxResults === "number" ? input.maxResults : 25,
        });
        // Project to slim shape — drop htmlLink, verbose description, per-attendee responseStatus.
        // Claude can call calendar_get_event for full details if needed.
        const slim = {
          ...result,
          events: result.events?.map((e: Record<string, unknown>) => ({
            id: e.id,
            summary: e.summary,
            start: e.start,
            end: e.end,
            location: e.location,
            attendees: (e.attendees as { email: string }[] | undefined)?.map((a) => a.email),
          })),
        };
        return { content: JSON.stringify(slim) };
      }

      case "calendar_get_event": {
        if (!input.eventId || typeof input.eventId !== "string") {
          return { content: "eventId is required and must be a string.", is_error: true };
        }
        const result = await getEvent({
          accessToken,
          calendarId: (input.calendarId as string | undefined) ?? "primary",
          eventId: input.eventId,
        });
        return { content: JSON.stringify(result) };
      }

      case "calendar_create_event": {
        if (!input.summary || typeof input.summary !== "string") {
          return { content: "summary is required and must be a string.", is_error: true };
        }
        if (!input.start || typeof input.start !== "object") {
          return { content: "start is required and must be an object with dateTime or date.", is_error: true };
        }
        if (!input.end || typeof input.end !== "object") {
          return { content: "end is required and must be an object with dateTime or date.", is_error: true };
        }
        const result = await createEvent({
          accessToken,
          calendarId: (input.calendarId as string | undefined) ?? "primary",
          summary: input.summary,
          start: input.start as { dateTime?: string; date?: string; timeZone?: string },
          end: input.end as { dateTime?: string; date?: string; timeZone?: string },
          description: input.description as string | undefined,
          location: input.location as string | undefined,
          attendees: input.attendees as { email: string }[] | undefined,
        });
        return { content: JSON.stringify(result) };
      }

      case "calendar_update_event": {
        if (!input.eventId || typeof input.eventId !== "string") {
          return { content: "eventId is required and must be a string.", is_error: true };
        }
        const result = await updateEvent({
          accessToken,
          calendarId: (input.calendarId as string | undefined) ?? "primary",
          eventId: input.eventId,
          summary: input.summary as string | undefined,
          start: input.start as { dateTime?: string; date?: string; timeZone?: string } | undefined,
          end: input.end as { dateTime?: string; date?: string; timeZone?: string } | undefined,
          description: input.description as string | undefined,
          location: input.location as string | undefined,
          attendees: input.attendees as { email: string }[] | undefined,
        });
        return { content: JSON.stringify(result) };
      }

      case "calendar_delete_event": {
        if (!input.eventId || typeof input.eventId !== "string") {
          return { content: "eventId is required and must be a string.", is_error: true };
        }
        const result = await deleteEvent({
          accessToken,
          calendarId: (input.calendarId as string | undefined) ?? "primary",
          eventId: input.eventId,
        });
        return { content: JSON.stringify(result) };
      }

      default:
        return {
          content: `Unknown calendar tool: ${name}`,
          is_error: true,
        };
    }
  } catch (err) {
    if (err instanceof GoogleCalendarError) {
      return {
        content: `Calendar error (${err.status}): ${err.message}`,
        is_error: true,
      };
    }
    console.error(`[calendar-tool] Unexpected error in ${name}:`, err);
    return {
      content: "Unexpected error calling Calendar API.",
      is_error: true,
    };
  }
}
