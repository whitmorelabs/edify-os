/**
 * report_event tool — any agent can call this to report a significant
 * organizational event (grant awarded, donor gift, program milestone, etc.).
 *
 * The tool inserts an org_event row and fires the ripple engine
 * asynchronously (fire-and-forget) so the chat response is not blocked.
 */

import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { EVENT_TYPES, EVENT_TYPE_KEYS } from "@/lib/ripple/event-types";

// ---------------------------------------------------------------------------
// System-prompt addendum
// ---------------------------------------------------------------------------

export const REPORT_EVENT_TOOLS_ADDENDUM = `
## Organizational event reporting

You have access to \`report_event\`. Call it whenever the user reports a significant organizational event such as:
- A grant being awarded, submitted, or rejected
- A donor gift received
- A program milestone reached
- A new hire or volunteer joining
- A board meeting being scheduled
- An event being confirmed

This triggers automatic follow-up actions across other team members. You should call this tool proactively when the conversation contains a clear organizational event, even if the user doesn't explicitly ask you to.
`;

// ---------------------------------------------------------------------------
// Tool definition
// ---------------------------------------------------------------------------

export const reportEventTool: Anthropic.Tool = {
  name: "report_event",
  description:
    "Report a significant organizational event (grant awarded, donor gift, program milestone, etc.) that should trigger follow-up actions across other team members.",
  input_schema: {
    type: "object" as const,
    properties: {
      event_type: {
        type: "string",
        enum: EVENT_TYPE_KEYS as unknown as string[],
        description: "Type of event",
      },
      title: {
        type: "string",
        description: "Brief title of the event",
      },
      details: {
        type: "string",
        description:
          "Detailed description including amounts, names, dates",
      },
    },
    required: ["event_type", "title", "details"],
  },
};

export const reportEventTools: Anthropic.Tool[] = [reportEventTool];

// ---------------------------------------------------------------------------
// Tool executor
// ---------------------------------------------------------------------------

export interface ExecuteReportEventToolOptions {
  name: string;
  input: Record<string, unknown>;
  orgId: string;
  sourceAgent: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: SupabaseClient<any>;
}

export async function executeReportEventTool({
  name,
  input,
  orgId,
  sourceAgent,
  serviceClient,
}: ExecuteReportEventToolOptions): Promise<{
  content: string;
  is_error?: boolean;
}> {
  if (name !== "report_event") {
    return { content: `Unknown report-event tool: ${name}`, is_error: true };
  }

  const eventType = input.event_type as string | undefined;
  const title = input.title as string | undefined;
  const details = input.details as string | undefined;

  if (!eventType || !title || !details) {
    return {
      content:
        "report_event requires event_type, title, and details.",
      is_error: true,
    };
  }

  if (!(eventType in EVENT_TYPES)) {
    return {
      content: `Unknown event type: ${eventType}`,
      is_error: true,
    };
  }

  try {
    // Insert the org event
    const { data: event, error: insertError } = await serviceClient
      .from("org_events")
      .insert({
        org_id: orgId,
        event_type: eventType,
        source_agent: sourceAgent,
        payload: { title, details },
        processed: false,
      })
      .select("id")
      .single();

    if (insertError || !event) {
      console.error("[report_event] Failed to insert org_event:", insertError);
      return {
        content: "Failed to record the event. Please try again.",
        is_error: true,
      };
    }

    // Fire the ripple engine asynchronously (fire-and-forget)
    // We use a fetch to the internal API so the chat response is not blocked.
    //
    // Operator-precedence note: the previous form
    //   NEXT_PUBLIC_APP_URL || VERCEL_URL ? `https://${VERCEL_URL}` : "..."
    // parses as `(NEXT_PUBLIC_APP_URL || VERCEL_URL) ? ... : ...`, which
    // means even when NEXT_PUBLIC_APP_URL was set we used VERCEL_URL — the
    // auto-generated deployment-specific URL, NOT the registered OAuth
    // redirect URI. Use ?? chaining so NEXT_PUBLIC_APP_URL is honored when
    // present.
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    fetch(`${baseUrl}/api/ripple/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id: event.id, org_id: orgId }),
    }).catch((err) => {
      // Fire-and-forget — log but don't fail the tool
      console.error("[report_event] Failed to trigger ripple processing:", err);
    });

    const eventLabel =
      EVENT_TYPES[eventType as keyof typeof EVENT_TYPES]?.label ?? eventType;

    return {
      content: `Event recorded: "${title}" (${eventLabel}). Follow-up actions are being generated across your team.`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return {
      content: `Failed to report event: ${msg}`,
      is_error: true,
    };
  }
}
