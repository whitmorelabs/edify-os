/**
 * Anthropic tool definition + executor for the grant-matching meta-tool.
 *
 * One tool: find_grants_for_org — the headline differentiation feature for
 * Dev Director. Aggregates from all of the wired-in grant/funder sources,
 * applies hard filters, then asks Sonnet to rank against the org profile
 * and return a top-12 with explainable citations.
 *
 * Architecture (Option A meta-tool, see PRD-aca98e3f):
 *   - Single user-visible call.
 *   - Internal Sonnet judge call uses prompt caching on the org-profile
 *     preamble — keeps the per-match cost sub-dollar across repeated runs
 *     for the same org.
 *   - Citations cannot be fabricated: the executor projects ranked rows
 *     back from the real candidate pool.
 *
 * What makes this different from the existing 9 grant tools:
 *   The 9 existing tools (grants_search, foundation_grants_paid_by_ein,
 *   etc.) are *search primitives* — they answer "what's open?" or "who has
 *   this funder funded?". This tool is the *matching engine* — it answers
 *   "given OUR org's specifics, here are 12 ranked opportunities with
 *   reasons." It's the difference between a search box and an analyst.
 */

import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  findGrantsForOrg,
  type MatcherOrgProfile,
  type MatcherOptions,
} from "@/lib/grant-matcher";

// ---------------------------------------------------------------------------
// System-prompt addendum.
// ---------------------------------------------------------------------------

export const GRANT_MATCHER_TOOLS_ADDENDUM = `\nYou have access to find_grants_for_org — the grant-matching engine. This is the recommended tool when the user asks "what grants should we apply for?", "find grants for our org", "what funders match us?", or any open-ended prospecting question. It chains all of your grant/funder data sources, scores candidates against the org's mission/geography/programs, and returns a ranked top 12 with citation URLs. Pass refinements via the optional fields (focus_area, geography, deadline_within_days, max_amount, foundation_eins) when the user gives you cues — otherwise the tool reads the org profile directly. The tool returns structured JSON with each match's source, deadline, amount, match_score (0-100), why_match (1-2 sentence explanation), and citation_url. NEVER fabricate matches: if the tool returns an empty list, surface that politely (the candidate pool was empty after hard filters) — do NOT invent grants. ALWAYS surface the citation_url for each match in your reply so the user can verify against the source. Use this BEFORE falling back to grants_search / foundation_grants_paid_by_ein / federal_register_search_grants individually — those are for follow-up drill-down on a specific match.`;

// ---------------------------------------------------------------------------
// Tool definition (model-facing).
// ---------------------------------------------------------------------------

export const grantMatcherTools: Anthropic.Tool[] = [
  {
    name: "find_grants_for_org",
    description:
      "Match the user's organization against open federal/state/foundation grant opportunities and return a ranked top 12 with citations. Aggregates Grants.gov + CA Grants Portal + Federal Register (and optionally foundation grant histories), applies deadline/amount/eligibility filters, then ranks survivors against the org's mission and programs using Claude. Use this for any 'what grants fit us?' / 'find prospects for us' / 'rank these funders' question — it is the highest-leverage Dev Director tool. Returns each match with title, source, amount, deadline (ISO or null), match_score (0-100), why_match (cites the specific org attribute the grant aligns with), and citation_url (real source URL). No fabrication: an empty match list means the candidate pool was empty after filters.",
    input_schema: {
      type: "object" as const,
      properties: {
        focus_area: {
          type: "string",
          description:
            "Optional refinement of the org's cause area for better keyword matching (e.g. 'Youth Development', 'Community Health', 'Environmental Justice'). If omitted, the org's mission is used.",
        },
        geography: {
          type: "string",
          description:
            "Optional geography override (e.g. 'Detroit, MI' or 'California statewide'). Triggers California-specific source inclusion when 'California' or 'CA' is detected. If omitted, no geographic refinement is applied beyond what the federal sources provide.",
        },
        beneficiaries: {
          type: "string",
          description:
            "Optional free-text describing who the org serves (e.g. 'at-risk youth ages 12-18'). Improves ranking quality.",
        },
        annual_budget: {
          type: "string",
          description:
            "Optional annual operating budget hint (e.g. '$400K/year'). Helps the matcher reason about realistic award amounts.",
        },
        current_programs: {
          type: "array",
          description:
            "Optional list of running program names the org wants to fund. Bullet points the matcher reads when scoring relevance.",
          items: { type: "string" },
        },
        deadline_within_days: {
          type: "number",
          description:
            "Hard cap on how far in the future a deadline can be (defaults to 365). Use a smaller number for 'open in the next 60 days' style queries.",
        },
        min_amount: {
          type: "number",
          description:
            "Optional minimum award amount in USD. Drops grants whose ceiling is below this. Use when the user wants 'at least $50K' style filtering.",
        },
        max_amount: {
          type: "number",
          description:
            "Optional maximum award amount in USD. Drops grants whose floor is above this. Use when the user wants small-grant scope.",
        },
        eligibility: {
          type: "string",
          description:
            "Optional eligibility category code (e.g. 'nonprofits', 'small_businesses', 'state_governments'). Defaults to 'nonprofits' for the federal Grants.gov source.",
        },
        foundation_eins: {
          type: "array",
          description:
            "Optional list of foundation EINs the user wants peer-funding history pulled for. EXPENSIVE — each EIN is 3-10s of S3+parse latency, capped at 5. Only include when the user has shortlisted prospects (e.g. 'compare us against Ford and Hewlett's recent grantees').",
          items: { type: "string" },
        },
        top_n: {
          type: "number",
          description:
            "Cap on returned matches. Defaults to 12 (PRD-mandated). Lower for chat brevity, raise for comprehensive listings up to 25.",
        },
      },
      required: [],
    },
  },
];

// ---------------------------------------------------------------------------
// Executor.
// ---------------------------------------------------------------------------

interface OrgRow {
  name: string | null;
  mission: string | null;
}

export async function executeGrantMatcherTool({
  name,
  input,
  orgId,
  serviceClient,
  anthropic,
}: {
  name: string;
  input: Record<string, unknown>;
  orgId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: SupabaseClient<any>;
  anthropic: Anthropic;
}): Promise<{ content: string; is_error?: boolean }> {
  if (name !== "find_grants_for_org") {
    return {
      content: `Unknown grant-matcher tool: ${name}`,
      is_error: true,
    };
  }

  // Pull the org's name + mission. Required for the matcher's preamble.
  const { data, error } = await serviceClient
    .from("orgs")
    .select("name, mission")
    .eq("id", orgId)
    .single();
  if (error || !data) {
    return {
      content:
        "Could not load org profile for matching. Make sure your organization name and mission are filled in under Settings.",
      is_error: true,
    };
  }
  const orgRow = data as OrgRow;
  if (!orgRow.name || !orgRow.mission) {
    return {
      content:
        "Org profile is incomplete — both organization name and mission statement are required for grant matching. Update them under Settings → Organization and try again.",
      is_error: true,
    };
  }

  // Build the matcher profile from the org row + per-call refinements.
  const profile: MatcherOrgProfile = {
    orgName: orgRow.name,
    mission: orgRow.mission,
    geography: typeof input.geography === "string" ? input.geography : undefined,
    focusArea:
      typeof input.focus_area === "string" ? input.focus_area : undefined,
    annualBudget:
      typeof input.annual_budget === "string"
        ? input.annual_budget
        : undefined,
    beneficiaries:
      typeof input.beneficiaries === "string"
        ? input.beneficiaries
        : undefined,
    currentPrograms: Array.isArray(input.current_programs)
      ? input.current_programs.filter((p): p is string => typeof p === "string")
      : undefined,
    foundationEins: Array.isArray(input.foundation_eins)
      ? input.foundation_eins.filter((e): e is string => typeof e === "string")
      : undefined,
    eligibility:
      typeof input.eligibility === "string" ? input.eligibility : undefined,
  };

  const options: MatcherOptions = {
    deadlineWithinDays:
      typeof input.deadline_within_days === "number"
        ? input.deadline_within_days
        : undefined,
    minAmount:
      typeof input.min_amount === "number" ? input.min_amount : undefined,
    maxAmount:
      typeof input.max_amount === "number" ? input.max_amount : undefined,
    topN: typeof input.top_n === "number" ? input.top_n : undefined,
  };

  try {
    const result = await findGrantsForOrg(profile, options, anthropic);
    return { content: JSON.stringify(result) };
  } catch (err) {
    console.error("[grant-matcher-tool] Unexpected error:", err);
    const msg = err instanceof Error ? err.message : "Grant matching failed.";
    return {
      content: `Grant matching failed: ${msg}`,
      is_error: true,
    };
  }
}
