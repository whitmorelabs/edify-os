/**
 * Central tool registry — maps archetype slugs to their allowed tool sets,
 * and dispatches tool-call execution from the chat route.
 *
 * Adding tools to a new archetype: add them to ARCHETYPE_TOOLS and add a
 * dispatch branch in executeTool below.
 */

import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { calendarTools, executeCalendarTool, CALENDAR_TOOLS_ADDENDUM } from "@/lib/tools/calendar";
import { grantsTools, executeGrantsTool, GRANTS_TOOLS_ADDENDUM } from "@/lib/tools/grants";
import { crmTools, executeCrmTool, CRM_TOOLS_ADDENDUM } from "@/lib/tools/crm";
import { gmailTools, executeGmailTool, GMAIL_TOOLS_ADDENDUM } from "@/lib/tools/gmail";
import { driveTools, executeDriveTool, DRIVE_TOOLS_ADDENDUM } from "@/lib/tools/drive";
import { unsplashTools, executeUnsplashTool, UNSPLASH_TOOLS_ADDENDUM } from "@/lib/tools/unsplash";
import {
  renderTools,
  executeRenderTool,
  RENDER_TOOLS_ADDENDUM,
  type RenderToolGeneratedFile,
} from "@/lib/tools/render";
import { socialTools, executeSocialTool, SOCIAL_TOOLS_ADDENDUM } from "@/lib/tools/social";
import { webSearchTools, executeWebSearchTool, WEBSEARCH_TOOLS_ADDENDUM } from "@/lib/tools/websearch";
import { getValidGoogleAccessToken, type GoogleIntegrationType } from "@/lib/google";
import { ARCHETYPE_SLUGS, type ArchetypeSlug } from "@/lib/archetypes";

// Re-export all tool-family addendums from a single location so callers
// don't need to know which file each came from.
export {
  CALENDAR_TOOLS_ADDENDUM,
  GRANTS_TOOLS_ADDENDUM,
  CRM_TOOLS_ADDENDUM,
  GMAIL_TOOLS_ADDENDUM,
  DRIVE_TOOLS_ADDENDUM,
  UNSPLASH_TOOLS_ADDENDUM,
  RENDER_TOOLS_ADDENDUM,
  SOCIAL_TOOLS_ADDENDUM,
  WEBSEARCH_TOOLS_ADDENDUM,
};
export type { RenderToolGeneratedFile };

// Tool names that belong to the Unsplash family but don't share a common prefix.
// Kept as a Set so dispatch is O(1) and easy to extend if we add more photo tools.
const UNSPLASH_TOOL_NAMES = new Set(unsplashTools.map((t) => t.name));
const RENDER_TOOL_NAMES = new Set(renderTools.map((t) => t.name));
const SOCIAL_TOOL_NAMES = new Set(socialTools.map((t) => t.name));
const WEBSEARCH_TOOL_NAMES = new Set(webSearchTools.map((t) => t.name));

// ---------------------------------------------------------------------------
// System-prompt addendum helpers
// ---------------------------------------------------------------------------

/**
 * One pass over the tools array to determine which tool families are present.
 * Returns a Set of prefix strings, e.g. Set { "calendar", "grants", "crm" }.
 */
export function getToolFamilies(tools: Anthropic.Tool[]): Set<string> {
  const families = new Set<string>();
  for (const t of tools) {
    // Unsplash tool names (e.g. "search_stock_photo") don't share a common prefix
    // with their family — map them explicitly. All other tools use the first
    // underscore-segment as the family key (calendar_, grants_, crm_, etc.).
    if (UNSPLASH_TOOL_NAMES.has(t.name)) {
      families.add("unsplash");
      continue;
    }
    if (RENDER_TOOL_NAMES.has(t.name)) {
      families.add("render");
      continue;
    }
    if (SOCIAL_TOOL_NAMES.has(t.name)) {
      families.add("social");
      continue;
    }
    if (WEBSEARCH_TOOL_NAMES.has(t.name)) {
      families.add("websearch");
      continue;
    }
    const prefix = t.name.split("_")[0];
    if (prefix) families.add(prefix);
  }
  return families;
}

/**
 * Build the concatenated system-prompt addendum for a given tool set.
 * Replaces 3 separate Array.some() scans in the chat route with a single loop.
 */
export function buildSystemAddendums(tools: Anthropic.Tool[]): string {
  const families = getToolFamilies(tools);
  const parts: string[] = [];
  if (families.has("calendar")) parts.push(CALENDAR_TOOLS_ADDENDUM);
  if (families.has("grants")) parts.push(GRANTS_TOOLS_ADDENDUM);
  if (families.has("crm")) parts.push(CRM_TOOLS_ADDENDUM);
  if (families.has("gmail")) parts.push(GMAIL_TOOLS_ADDENDUM);
  if (families.has("drive")) parts.push(DRIVE_TOOLS_ADDENDUM);
  if (families.has("unsplash")) parts.push(UNSPLASH_TOOLS_ADDENDUM);
  if (families.has("render")) parts.push(RENDER_TOOLS_ADDENDUM);
  if (families.has("social")) parts.push(SOCIAL_TOOLS_ADDENDUM);
  if (families.has("websearch")) parts.push(WEBSEARCH_TOOLS_ADDENDUM);
  return parts.join("");
}

// ---------------------------------------------------------------------------
// Per-archetype tool sets
// Slugs use underscores — matches ARCHETYPE_SLUGS in lib/archetypes.ts
// ---------------------------------------------------------------------------

export const ARCHETYPE_TOOLS: Record<ArchetypeSlug, Anthropic.Tool[]> = {
  executive_assistant: [...calendarTools, ...gmailTools, ...driveTools],
  events_director: [...calendarTools, ...driveTools, ...unsplashTools],
  development_director: [...grantsTools, ...webSearchTools, ...crmTools, ...gmailTools, ...driveTools],
  marketing_director: [...driveTools, ...unsplashTools, ...renderTools, ...socialTools],
  programs_director: [...grantsTools, ...webSearchTools, ...driveTools],
  hr_volunteer_coordinator: [],
};

// Exhaust-check: ensures ARCHETYPE_TOOLS stays in sync with ARCHETYPE_SLUGS at compile time.
// If a slug is added to archetypes.ts, TypeScript will error here until registry is updated.
const _exhaustCheck: Record<ArchetypeSlug, unknown> = ARCHETYPE_TOOLS;
void _exhaustCheck;

// ---------------------------------------------------------------------------
// Tool dispatcher
// ---------------------------------------------------------------------------

const GOOGLE_NOT_CONNECTED = "Google Workspace is not connected for this organization. Please visit Settings → Integrations to connect a Google account.";

/** Resolve a Google access token: use pre-fetched value or fetch from DB.
 *  Returns the token string, or an error result object to return immediately. */
async function resolveGoogleToken(
  integrationKey: GoogleIntegrationType,
  preFetchedTokens: Map<string, string> | undefined,
  serviceClient: SupabaseClient<any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  orgId: string,
): Promise<string | { content: string; is_error: true }> {
  const cached = preFetchedTokens?.get(integrationKey);
  if (cached) return cached;
  const result = await getValidGoogleAccessToken(serviceClient, orgId, integrationKey);
  if ("error" in result) return { content: GOOGLE_NOT_CONNECTED, is_error: true };
  return result.accessToken;
}

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
  anthropic,
}: {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: Record<string, unknown>;
  orgId: string;
  memberId: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: SupabaseClient<any>;
  preFetchedTokens?: Map<string, string>;
  /** Optional Anthropic client — required only for tools that upload files
   *  (currently render_design_to_image). Safe to omit for other tools. */
  anthropic?: Anthropic;
}): Promise<{ content: string; is_error?: boolean; generatedFile?: RenderToolGeneratedFile }> {
  if (name.startsWith("calendar_")) {
    const token = await resolveGoogleToken("google_calendar", preFetchedTokens, serviceClient, orgId);
    if (typeof token !== "string") return token;
    return executeCalendarTool({ name, input, accessToken: token });
  }

  if (name.startsWith("grants_")) {
    return executeGrantsTool({ name, input });
  }

  if (name.startsWith("crm_")) {
    return executeCrmTool({ name, input, orgId, memberId, serviceClient });
  }

  if (name.startsWith("gmail_")) {
    const token = await resolveGoogleToken("gmail", preFetchedTokens, serviceClient, orgId);
    if (typeof token !== "string") return token;
    return executeGmailTool({ name, input, accessToken: token });
  }

  if (name.startsWith("drive_")) {
    const token = await resolveGoogleToken("google_drive", preFetchedTokens, serviceClient, orgId);
    if (typeof token !== "string") return token;
    return executeDriveTool({ name, input, accessToken: token });
  }

  if (UNSPLASH_TOOL_NAMES.has(name)) {
    return executeUnsplashTool({ name, input });
  }

  if (RENDER_TOOL_NAMES.has(name)) {
    if (!anthropic) {
      return {
        content: "Render tool requires an Anthropic client; none was provided.",
        is_error: true,
      };
    }
    return executeRenderTool({ name, input, anthropic });
  }

  if (SOCIAL_TOOL_NAMES.has(name)) {
    return executeSocialTool({ name, input, orgId, serviceClient });
  }

  if (WEBSEARCH_TOOL_NAMES.has(name)) {
    return executeWebSearchTool({ name, input });
  }

  return { content: `Unknown tool: ${name}`, is_error: true };
}

// Re-export for convenience so callers can import everything from registry
export { ARCHETYPE_SLUGS };
