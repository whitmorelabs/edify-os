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
import { nonprofitTools, executeNonprofitTool, NONPROFIT_TOOLS_ADDENDUM } from "@/lib/tools/nonprofit";
import { usaspendingTools, executeUSAspendingTool, USASPENDING_TOOLS_ADDENDUM } from "@/lib/tools/usaspending";
import { caGrantsTools, executeCaGrantsTool, CA_GRANTS_TOOLS_ADDENDUM } from "@/lib/tools/ca-grants";
import { charityNavigatorTools, executeCharityNavigatorTool, CHARITY_NAVIGATOR_TOOLS_ADDENDUM } from "@/lib/tools/charity-navigator";
import { candidDemographicsTools, executeCandidDemographicsTool, CANDID_DEMOGRAPHICS_TOOLS_ADDENDUM } from "@/lib/tools/candid-demographics";
import { foundationGrantsTools, executeFoundationGrantsTool, FOUNDATION_GRANTS_TOOLS_ADDENDUM } from "@/lib/tools/foundation-grants";
import { crmTools, executeCrmTool, CRM_TOOLS_ADDENDUM } from "@/lib/tools/crm";
import { gmailTools, executeGmailTool, GMAIL_TOOLS_ADDENDUM } from "@/lib/tools/gmail";
import { driveTools, executeDriveTool, DRIVE_TOOLS_ADDENDUM } from "@/lib/tools/drive";
import { memoryTools, executeMemoryTool, MEMORY_TOOLS_ADDENDUM } from "@/lib/tools/memory";
import { unsplashTools, executeUnsplashTool, UNSPLASH_TOOLS_ADDENDUM } from "@/lib/tools/unsplash";
import {
  renderTools,
  executeRenderTool,
  RENDER_TOOLS_ADDENDUM,
  type RenderToolGeneratedFile,
} from "@/lib/tools/render";
import { socialTools, executeSocialTool, SOCIAL_TOOLS_ADDENDUM } from "@/lib/tools/social";
import { webSearchTools, executeWebSearchTool, WEBSEARCH_TOOLS_ADDENDUM, webSearchServerTool } from "@/lib/tools/websearch";
import { handoffTools, executeHandoffTool, HANDOFF_TOOLS_ADDENDUM } from "@/lib/tools/handoff";
import {
  canvaGenerateTools,
  executeCanvaGenerateTool,
  CANVA_GENERATE_TOOLS_ADDENDUM,
} from "@/lib/tools/canva-generate-design";
import {
  canvaExportTools,
  executeCanvaExportTool,
  CANVA_EXPORT_TOOLS_ADDENDUM,
} from "@/lib/tools/canva-export-design";
import {
  repurposeTools,
  executeRepurposeTool,
  REPURPOSE_TOOLS_ADDENDUM,
} from "@/lib/tools/repurpose-across-platforms";
import {
  brandGuidelinesTools,
  executeBrandGuidelinesTool,
  BRAND_GUIDELINES_TOOLS_ADDENDUM,
} from "@/lib/tools/brand-guidelines-from-url";
import {
  reportEventTools,
  executeReportEventTool,
  REPORT_EVENT_TOOLS_ADDENDUM,
} from "@/lib/tools/report-event";
import {
  impactDataTools,
  impactDataWriteTools,
  impactDataReadTools,
  executeImpactDataTool,
  IMPACT_DATA_TOOLS_ADDENDUM,
} from "@/lib/tools/impact-data";
import {
  consultTeammateTools,
  executeConsultTeammateTool,
  CONSULT_TEAMMATE_TOOLS_ADDENDUM,
} from "@/lib/tools/consult-teammate";
import { getValidGoogleAccessToken, type GoogleIntegrationType } from "@/lib/google";
import { ARCHETYPE_SLUGS, type ArchetypeSlug } from "@/lib/archetypes";

// Re-export all tool-family addendums from a single location so callers
// don't need to know which file each came from.
export {
  CALENDAR_TOOLS_ADDENDUM,
  GRANTS_TOOLS_ADDENDUM,
  NONPROFIT_TOOLS_ADDENDUM,
  USASPENDING_TOOLS_ADDENDUM,
  CA_GRANTS_TOOLS_ADDENDUM,
  CHARITY_NAVIGATOR_TOOLS_ADDENDUM,
  CANDID_DEMOGRAPHICS_TOOLS_ADDENDUM,
  FOUNDATION_GRANTS_TOOLS_ADDENDUM,
  CRM_TOOLS_ADDENDUM,
  GMAIL_TOOLS_ADDENDUM,
  DRIVE_TOOLS_ADDENDUM,
  MEMORY_TOOLS_ADDENDUM,
  UNSPLASH_TOOLS_ADDENDUM,
  RENDER_TOOLS_ADDENDUM,
  SOCIAL_TOOLS_ADDENDUM,
  WEBSEARCH_TOOLS_ADDENDUM,
  HANDOFF_TOOLS_ADDENDUM,
  CANVA_GENERATE_TOOLS_ADDENDUM,
  CANVA_EXPORT_TOOLS_ADDENDUM,
  REPURPOSE_TOOLS_ADDENDUM,
  BRAND_GUIDELINES_TOOLS_ADDENDUM,
  REPORT_EVENT_TOOLS_ADDENDUM,
  IMPACT_DATA_TOOLS_ADDENDUM,
  CONSULT_TEAMMATE_TOOLS_ADDENDUM,
};
export type { RenderToolGeneratedFile };

// Tool names that belong to the Unsplash family but don't share a common prefix.
// Kept as a Set so dispatch is O(1) and easy to extend if we add more photo tools.
const UNSPLASH_TOOL_NAMES = new Set(unsplashTools.map((t) => t.name));
const RENDER_TOOL_NAMES = new Set(renderTools.map((t) => t.name));
const SOCIAL_TOOL_NAMES = new Set(socialTools.map((t) => t.name));
// webSearchTools is never[] (server tool — no client definitions). Cast to avoid TS error.
const WEBSEARCH_TOOL_NAMES = new Set((webSearchTools as Anthropic.Tool[]).map((t) => t.name));
const MEMORY_TOOL_NAMES = new Set(memoryTools.map((t) => t.name));
const HANDOFF_TOOL_NAMES = new Set(handoffTools.map((t) => t.name));
const CANVA_GENERATE_TOOL_NAMES = new Set(canvaGenerateTools.map((t) => t.name));
const CANVA_EXPORT_TOOL_NAMES = new Set(canvaExportTools.map((t) => t.name));
const REPURPOSE_TOOL_NAMES = new Set(repurposeTools.map((t) => t.name));
const BRAND_GUIDELINES_TOOL_NAMES = new Set(brandGuidelinesTools.map((t) => t.name));
const REPORT_EVENT_TOOL_NAMES = new Set(reportEventTools.map((t) => t.name));
const IMPACT_DATA_TOOL_NAMES = new Set(impactDataTools.map((t) => t.name));
const CONSULT_TEAMMATE_TOOL_NAMES = new Set(consultTeammateTools.map((t) => t.name));
// ca_grants_* tool names start with "ca_" — the prefix-split fallback would
// resolve them to family "ca", which is ambiguous if more state portals land.
// Pin the family to "ca_grants" via an explicit name set.
const CA_GRANTS_TOOL_NAMES = new Set(caGrantsTools.map((t) => t.name));
// charity_navigator_* and candid_demographics_* both have multi-segment
// prefixes. Pin them via explicit name sets so the prefix-split fallback
// doesn't resolve them to "charity" / "candid".
const CHARITY_NAVIGATOR_TOOL_NAMES = new Set(
  charityNavigatorTools.map((t) => t.name),
);
const CANDID_DEMOGRAPHICS_TOOL_NAMES = new Set(
  candidDemographicsTools.map((t) => t.name),
);
// foundation_grants_paid_by_ein has prefix "foundation_grants" — pin via name
// set so the prefix-split fallback doesn't resolve it to "foundation".
const FOUNDATION_GRANTS_TOOL_NAMES = new Set(
  foundationGrantsTools.map((t) => t.name),
);

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
    if (MEMORY_TOOL_NAMES.has(t.name)) {
      families.add("memory");
      continue;
    }
    if (HANDOFF_TOOL_NAMES.has(t.name)) {
      families.add("handoff");
      continue;
    }
    if (CANVA_GENERATE_TOOL_NAMES.has(t.name)) {
      families.add("canva_generate");
      continue;
    }
    if (CANVA_EXPORT_TOOL_NAMES.has(t.name)) {
      families.add("canva_export");
      continue;
    }
    if (REPURPOSE_TOOL_NAMES.has(t.name)) {
      families.add("repurpose");
      continue;
    }
    if (BRAND_GUIDELINES_TOOL_NAMES.has(t.name)) {
      families.add("brand_guidelines");
      continue;
    }
    if (REPORT_EVENT_TOOL_NAMES.has(t.name)) {
      families.add("report_event");
      continue;
    }
    if (IMPACT_DATA_TOOL_NAMES.has(t.name)) {
      families.add("impact_data");
      continue;
    }
    if (CONSULT_TEAMMATE_TOOL_NAMES.has(t.name)) {
      families.add("consult_teammate");
      continue;
    }
    if (CA_GRANTS_TOOL_NAMES.has(t.name)) {
      families.add("ca_grants");
      continue;
    }
    if (CHARITY_NAVIGATOR_TOOL_NAMES.has(t.name)) {
      families.add("charity_navigator");
      continue;
    }
    if (CANDID_DEMOGRAPHICS_TOOL_NAMES.has(t.name)) {
      families.add("candid_demographics");
      continue;
    }
    if (FOUNDATION_GRANTS_TOOL_NAMES.has(t.name)) {
      families.add("foundation_grants");
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
  if (families.has("nonprofit")) parts.push(NONPROFIT_TOOLS_ADDENDUM);
  if (families.has("usaspending")) parts.push(USASPENDING_TOOLS_ADDENDUM);
  if (families.has("ca_grants")) parts.push(CA_GRANTS_TOOLS_ADDENDUM);
  if (families.has("charity_navigator")) parts.push(CHARITY_NAVIGATOR_TOOLS_ADDENDUM);
  if (families.has("candid_demographics")) parts.push(CANDID_DEMOGRAPHICS_TOOLS_ADDENDUM);
  if (families.has("foundation_grants")) parts.push(FOUNDATION_GRANTS_TOOLS_ADDENDUM);
  if (families.has("crm")) parts.push(CRM_TOOLS_ADDENDUM);
  if (families.has("gmail")) parts.push(GMAIL_TOOLS_ADDENDUM);
  if (families.has("drive")) parts.push(DRIVE_TOOLS_ADDENDUM);
  if (families.has("unsplash")) parts.push(UNSPLASH_TOOLS_ADDENDUM);
  if (families.has("render")) parts.push(RENDER_TOOLS_ADDENDUM);
  if (families.has("social")) parts.push(SOCIAL_TOOLS_ADDENDUM);
  if (families.has("websearch")) parts.push(WEBSEARCH_TOOLS_ADDENDUM);
  if (families.has("memory")) parts.push(MEMORY_TOOLS_ADDENDUM);
  if (families.has("handoff")) parts.push(HANDOFF_TOOLS_ADDENDUM);
  if (families.has("canva_generate")) parts.push(CANVA_GENERATE_TOOLS_ADDENDUM);
  if (families.has("canva_export")) parts.push(CANVA_EXPORT_TOOLS_ADDENDUM);
  if (families.has("repurpose")) parts.push(REPURPOSE_TOOLS_ADDENDUM);
  if (families.has("brand_guidelines")) parts.push(BRAND_GUIDELINES_TOOLS_ADDENDUM);
  if (families.has("report_event")) parts.push(REPORT_EVENT_TOOLS_ADDENDUM);
  if (families.has("impact_data")) parts.push(IMPACT_DATA_TOOLS_ADDENDUM);
  if (families.has("consult_teammate")) parts.push(CONSULT_TEAMMATE_TOOLS_ADDENDUM);
  return parts.join("");
}

// ---------------------------------------------------------------------------
// Per-archetype tool sets
// Slugs use underscores — matches ARCHETYPE_SLUGS in lib/archetypes.ts
// ---------------------------------------------------------------------------

export const ARCHETYPE_TOOLS: Record<ArchetypeSlug, Anthropic.Tool[]> = {
  executive_assistant: [...calendarTools, ...gmailTools, ...driveTools, ...memoryTools, ...reportEventTools, ...impactDataReadTools, ...consultTeammateTools],
  events_director: [...calendarTools, ...driveTools, ...unsplashTools, ...memoryTools, ...reportEventTools, ...impactDataReadTools, ...consultTeammateTools],
  development_director: [...calendarTools, ...grantsTools, ...nonprofitTools, ...usaspendingTools, ...caGrantsTools, ...charityNavigatorTools, ...candidDemographicsTools, ...foundationGrantsTools, ...crmTools, ...gmailTools, ...driveTools, ...memoryTools, ...reportEventTools, ...impactDataReadTools, ...consultTeammateTools],
  marketing_director: [
    ...driveTools,
    ...unsplashTools,
    ...renderTools,
    ...socialTools,
    ...memoryTools,
    ...handoffTools,
    ...canvaGenerateTools,
    ...canvaExportTools,
    ...repurposeTools,
    ...brandGuidelinesTools,
    ...reportEventTools,
    ...impactDataReadTools,
    ...consultTeammateTools,
  ],
  programs_director: [...grantsTools, ...driveTools, ...memoryTools, ...reportEventTools, ...impactDataWriteTools, ...impactDataReadTools, ...consultTeammateTools],
  hr_volunteer_coordinator: [...driveTools, ...memoryTools, ...reportEventTools, ...impactDataReadTools, ...consultTeammateTools],
};

/**
 * Resolve the tool list for an archetype. All archetypes return their static
 * tool set directly — no DB hit needed.
 *
 * render_design_to_image is always available to Marketing Director regardless
 * of Canva connection state. HTML+CSS via @vercel/og is the primary
 * design-quality path; Canva handles structured/template needs alongside it.
 *
 * The async signature is kept for forward compatibility (future per-org gating).
 */
export async function resolveArchetypeTools({
  archetype,
}: {
  archetype: ArchetypeSlug;
  orgId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: SupabaseClient<any>;
}): Promise<Anthropic.Tool[]> {
  return ARCHETYPE_TOOLS[archetype] ?? [];
}

/** All directors get Claude's native web_search server tool */
export const ARCHETYPE_SERVER_TOOLS: Record<ArchetypeSlug, unknown[]> = {
  executive_assistant: [webSearchServerTool],
  events_director: [webSearchServerTool],
  development_director: [webSearchServerTool],
  marketing_director: [webSearchServerTool],
  programs_director: [webSearchServerTool],
  hr_volunteer_coordinator: [webSearchServerTool],
};

export { webSearchServerTool };

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
  archetypeSlug,
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
  /**
   * Optional archetype slug — passed through to drive_create_file so it can
   * auto-place new files under the per-archetype folder in Drive.
   * Safe to omit: falls back to Drive root.
   */
  archetypeSlug?: string;
}): Promise<{ content: string; is_error?: boolean; generatedFile?: RenderToolGeneratedFile }> {
  if (name.startsWith("calendar_")) {
    const token = await resolveGoogleToken("google_calendar", preFetchedTokens, serviceClient, orgId);
    if (typeof token !== "string") return token;
    return executeCalendarTool({ name, input, accessToken: token });
  }

  if (name.startsWith("grants_")) {
    return executeGrantsTool({ name, input });
  }

  if (name.startsWith("nonprofit_")) {
    return executeNonprofitTool({ name, input });
  }

  if (name.startsWith("usaspending_")) {
    return executeUSAspendingTool({ name, input });
  }

  if (name.startsWith("ca_grants_")) {
    return executeCaGrantsTool({ name, input });
  }

  if (name.startsWith("charity_navigator_")) {
    return executeCharityNavigatorTool({ name, input });
  }

  if (name.startsWith("candid_demographics_")) {
    return executeCandidDemographicsTool({ name, input });
  }

  if (FOUNDATION_GRANTS_TOOL_NAMES.has(name)) {
    return executeFoundationGrantsTool({ name, input });
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
    return executeDriveTool({ name, input, accessToken: token, archetypeSlug });
  }

  if (UNSPLASH_TOOL_NAMES.has(name)) {
    return executeUnsplashTool({ name, input });
  }

  if (RENDER_TOOL_NAMES.has(name)) {
    return executeRenderTool({ name, input, serviceClient, orgId });
  }

  if (SOCIAL_TOOL_NAMES.has(name)) {
    return executeSocialTool({ name, input, orgId, serviceClient });
  }

  if (WEBSEARCH_TOOL_NAMES.has(name)) {
    // Web search is a native server tool — Anthropic executes it, this branch is unreachable.
    return executeWebSearchTool();
  }

  if (MEMORY_TOOL_NAMES.has(name)) {
    return executeMemoryTool({ name, input, orgId, memberId, serviceClient });
  }

  if (HANDOFF_TOOL_NAMES.has(name)) {
    if (!anthropic) {
      return {
        content: "Handoff tool requires an Anthropic client; none was provided.",
        is_error: true,
      };
    }
    // Resolve org name from DB for the sub-turn system prompt.
    const { data: orgRow } = await serviceClient
      .from("orgs")
      .select("name")
      .eq("id", orgId)
      .single();
    const orgName = (orgRow?.name as string | null) ?? "your organization";
    return executeHandoffTool({ name, input, orgId, orgName, serviceClient, anthropic });
  }

  if (CANVA_GENERATE_TOOL_NAMES.has(name)) {
    return executeCanvaGenerateTool({ name, input, orgId, serviceClient });
  }

  if (CANVA_EXPORT_TOOL_NAMES.has(name)) {
    return executeCanvaExportTool({ name, input, orgId, serviceClient });
  }

  if (REPURPOSE_TOOL_NAMES.has(name)) {
    if (!anthropic) {
      return {
        content: "Repurpose tool requires an Anthropic client; none was provided.",
        is_error: true,
      };
    }
    return executeRepurposeTool({ name, input, anthropic });
  }

  if (BRAND_GUIDELINES_TOOL_NAMES.has(name)) {
    if (!anthropic) {
      return {
        content: "Brand guidelines tool requires an Anthropic client; none was provided.",
        is_error: true,
      };
    }
    return executeBrandGuidelinesTool({ name, input, orgId, memberId, serviceClient, anthropic });
  }

  if (REPORT_EVENT_TOOL_NAMES.has(name)) {
    return executeReportEventTool({
      name,
      input,
      orgId,
      sourceAgent: archetypeSlug ?? "unknown",
      serviceClient,
    });
  }

  if (IMPACT_DATA_TOOL_NAMES.has(name)) {
    return executeImpactDataTool({ name, input, orgId, serviceClient, archetypeSlug });
  }

  if (CONSULT_TEAMMATE_TOOL_NAMES.has(name)) {
    if (!anthropic) {
      return {
        content: "Consult teammate tool requires an Anthropic client; none was provided.",
        is_error: true,
      };
    }
    // Resolve org name from DB for the sub-turn system prompt.
    const { data: orgRow } = await serviceClient
      .from("orgs")
      .select("name")
      .eq("id", orgId)
      .single();
    const orgName = (orgRow?.name as string | null) ?? "your organization";
    return executeConsultTeammateTool({
      name,
      input,
      orgName,
      sourceArchetype: archetypeSlug ?? "unknown",
      anthropic,
    });
  }

  return { content: `Unknown tool: ${name}`, is_error: true };
}

// Re-export for convenience so callers can import everything from registry
export { ARCHETYPE_SLUGS };
