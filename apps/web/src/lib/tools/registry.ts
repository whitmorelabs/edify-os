/**
 * Central tool registry — maps archetype slugs to their allowed tool sets,
 * and dispatches tool-call execution from the chat route.
 *
 * Adding tools to a new archetype: add them to ARCHETYPE_TOOLS and add a
 * dispatch branch in executeTool below.
 */

import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { calendarTools, executeCalendarTool } from "@/lib/tools/calendar";
import { grantsTools, executeGrantsTool } from "@/lib/tools/grants";
import { crmTools, executeCrmTool } from "@/lib/tools/crm";
import { getValidGoogleAccessToken } from "@/lib/google";
import { ARCHETYPE_SLUGS, type ArchetypeSlug } from "@/lib/archetypes";

export { GRANTS_TOOLS_ADDENDUM } from "@/lib/tools/grants";
export { CRM_TOOLS_ADDENDUM } from "@/lib/tools/crm";

// ---------------------------------------------------------------------------
// Per-archetype tool sets
// Slugs use underscores — matches ARCHETYPE_SLUGS in lib/archetypes.ts
// ---------------------------------------------------------------------------

export const ARCHETYPE_TOOLS: Record<ArchetypeSlug, Anthropic.Tool[]> = {
  executive_assistant: calendarTools,
  events_director: calendarTools,
  development_director: [...grantsTools, ...crmTools],
  marketing_director: [],
  programs_director: [...grantsTools],
  hr_volunteer_coordinator: [],
};

// Exhaust-check: ensures ARCHETYPE_TOOLS stays in sync with ARCHETYPE_SLUGS at compile time.
// If a slug is added to archetypes.ts, TypeScript will error here until registry is updated.
const _exhaustCheck: Record<ArchetypeSlug, unknown> = ARCHETYPE_TOOLS;
void _exhaustCheck;

// ---------------------------------------------------------------------------
// Tool dispatcher
// ---------------------------------------------------------------------------

/**
 * Execute a tool call by name. Called from the chat route tool-use loop.
 * Handles Google token retrieval and translates NextResponse errors into
 * string-form tool errors (so Claude can explain the failure to the user).
 *
 * Pass `preFetchedTokens` to skip redundant DB lookups when multiple calendar
 * tools are called in the same round (token is fetched once in route.ts and
 * shared across the parallel Promise.all).
 */
export async function executeTool({
  name,
  input,
  orgId,
  memberId,
  serviceClient,
  preFetchedTokens,
}: {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: Record<string, unknown>;
  orgId: string;
  memberId: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: SupabaseClient<any>;
  preFetchedTokens?: Map<string, string>;
}): Promise<{ content: string; is_error?: boolean }> {
  if (name.startsWith("calendar_")) {
    // Use pre-fetched token if available; otherwise fetch now.
    let accessToken = preFetchedTokens?.get("google_calendar");
    if (!accessToken) {
      const tokenResult = await getValidGoogleAccessToken(
        serviceClient,
        orgId,
        "google_calendar"
      );
      if ("error" in tokenResult) {
        // Translate the NextResponse error into a user-friendly tool error string.
        // Claude will explain this to the user instead of pretending to access a calendar.
        return {
          content:
            "Google Workspace is not connected for this organization. Please visit Settings → Integrations to connect a Google account.",
          is_error: true,
        };
      }
      accessToken = tokenResult.accessToken;
    }
    return executeCalendarTool({
      name,
      input,
      accessToken,
    });
  }

  if (name.startsWith("grants_")) {
    return executeGrantsTool({ name, input });
  }

  if (name.startsWith("crm_")) {
    return executeCrmTool({ name, input, orgId, memberId, serviceClient });
  }

  return { content: `Unknown tool: ${name}`, is_error: true };
}

// Re-export for convenience so callers can import everything from registry
export { ARCHETYPE_SLUGS };
