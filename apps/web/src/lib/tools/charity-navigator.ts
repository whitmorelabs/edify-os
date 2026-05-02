/**
 * Anthropic tool definitions and executor for Charity Navigator's free-tier
 * GraphQL API. Two tools:
 *   - charity_navigator_search   — search rated 501(c)(3)s by name/EIN/state/cause
 *   - charity_navigator_profile  — fetch a single org's CN profile by EIN
 *
 * Both wrap publicSearchFaceted (the only query exposed to free-tier keys).
 *
 * Used by Development Director for funder due diligence:
 *   - "Is Foundation X rated highly by Charity Navigator?"
 *   - "What's their accountability/transparency score?"
 *   - "Find peer 4-star orgs in our state working on similar causes."
 *
 * Auth: requires CHARITY_NAVIGATOR_API_KEY env var (free, register at
 * developer.charitynavigator.org). When the env var is missing, both tools
 * surface a benign "not configured" message rather than throwing.
 */

import type Anthropic from "@anthropic-ai/sdk";
import {
  searchCharities,
  getCharityProfile,
  CharityNavigatorError,
} from "@/lib/charity-navigator";

// ---------------------------------------------------------------------------
// System-prompt addendum.
// ---------------------------------------------------------------------------

export const CHARITY_NAVIGATOR_TOOLS_ADDENDUM = `\nYou have access to Charity Navigator's free-tier GraphQL API for 501(c)(3) ratings and accountability data. Use charity_navigator_search to find rated charities by name, EIN, US state, or cause area — returns up to 25 hits with mission, encompass score (0–100), star rating (0–4), publication date, alert level, and CN profile URL. Use charity_navigator_profile to look up a specific org's CN profile by EIN. Note: only ~225,000 of the ~1.7M US nonprofits are rated by CN — many smaller orgs will return no results, which is informative ("not yet rated") rather than an error. Beacon-level breakdowns (Accountability/Finance/Impact/Culture) aren't exposed in the free tier — only the rolled-up encompass score is. Rate limits aren't formally documented by CN; if a 429 surfaces, back off and tell the user. Always cite the EIN and the charity_navigator_url so the user can read the full ratings narrative.`;

// ---------------------------------------------------------------------------
// Tool definitions (model-facing)
// ---------------------------------------------------------------------------

export const charityNavigatorTools: Anthropic.Tool[] = [
  {
    name: "charity_navigator_search",
    description:
      "Search Charity Navigator's rated 501(c)(3) charities by free-text term (name, EIN, or keyword), with optional state and cause filters. Use when the user asks 'is this charity rated?', 'find 4-star orgs in our space', or 'what's the accountability score for X?'. Returns up to 25 matches with EIN, name, mission, encompass score (0–100), star rating (0–4), CN profile URL, alert level, and address. Only rated 501(c)(3) charities (~225K of ~1.7M US nonprofits) appear here — small or unrated orgs return no hits, which is informative.",
    input_schema: {
      type: "object" as const,
      properties: {
        term: {
          type: "string",
          description:
            "Free-text query — charity name (e.g. 'Salvation Army'), EIN ('13-1684331' or '131684331'), or cause keyword. Required.",
        },
        states: {
          type: "array",
          items: { type: "string" },
          description:
            "Optional list of two-letter USPS state codes (e.g. ['NY', 'CA']) to narrow results. Omit for nationwide.",
        },
        causes: {
          type: "array",
          items: { type: "string" },
          description:
            "Optional list of CN cause filters (e.g. ['Animals', 'Education']). Use the labels CN uses in its UI.",
        },
        ratings: {
          type: "array",
          items: { type: "string" },
          description:
            "Optional star-rating filter — values like 'FOUR_STAR', 'THREE_STAR'. Use to surface only top-rated peer orgs.",
        },
        c3: {
          type: "boolean",
          description:
            "If true (default), restrict results to 501(c)(3) public charities. Set false to include other 501(c) types.",
        },
        limit: {
          type: "number",
          description:
            "Number of results to return (1–25). Defaults to 10. Capped at 25.",
        },
      },
      required: ["term"],
    },
  },
  {
    name: "charity_navigator_profile",
    description:
      "Fetch the Charity Navigator profile for a specific 501(c)(3) by EIN. Returns mission, encompass score, star rating, publication date, alert level, address, and CN profile URL. Use after a search or after the user provides an EIN they want to deep-dive. Returns 'not rated' if the EIN isn't in CN's rated set — many smaller charities aren't. Do not invent EINs.",
    input_schema: {
      type: "object" as const,
      properties: {
        ein: {
          type: "string",
          description:
            "The org's IRS Employer Identification Number, accepted in either '13-1684331' or '131684331' form. Required.",
        },
      },
      required: ["ein"],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool executor
// ---------------------------------------------------------------------------

export async function executeCharityNavigatorTool({
  name,
  input,
}: {
  name: string;
  input: Record<string, unknown>;
}): Promise<{ content: string; is_error?: boolean }> {
  try {
    switch (name) {
      case "charity_navigator_search": {
        const term = typeof input.term === "string" ? input.term : "";
        if (!term.trim()) {
          return {
            content: "term is required and must be a non-empty string.",
            is_error: true,
          };
        }
        const limit =
          typeof input.limit === "number"
            ? Math.max(1, Math.min(input.limit, 25))
            : 10;

        const result = await searchCharities({
          term,
          states: Array.isArray(input.states)
            ? (input.states.filter((s) => typeof s === "string") as string[])
            : undefined,
          causes: Array.isArray(input.causes)
            ? (input.causes.filter((c) => typeof c === "string") as string[])
            : undefined,
          ratings: Array.isArray(input.ratings)
            ? (input.ratings.filter((r) => typeof r === "string") as string[])
            : undefined,
          c3: typeof input.c3 === "boolean" ? input.c3 : undefined,
          limit,
        });

        return { content: JSON.stringify(result) };
      }

      case "charity_navigator_profile": {
        const ein = typeof input.ein === "string" ? input.ein : "";
        if (!ein.trim()) {
          return {
            content: "ein is required and must be a non-empty string.",
            is_error: true,
          };
        }
        const result = await getCharityProfile({ ein });
        if (!result.profile) {
          return {
            content: JSON.stringify({
              ein,
              found: false,
              note: "EIN not found in Charity Navigator's rated charity set (~225K of ~1.7M US nonprofits are rated). The org may still exist — try nonprofit_get_details for ProPublica's broader 990 coverage.",
            }),
          };
        }
        return {
          content: JSON.stringify({ ein, found: true, profile: result.profile }),
        };
      }

      default:
        return {
          content: `Unknown Charity Navigator tool: ${name}`,
          is_error: true,
        };
    }
  } catch (err) {
    if (err instanceof CharityNavigatorError) {
      return {
        content: `Charity Navigator API error (${err.status}): ${err.message}`,
        is_error: true,
      };
    }
    console.error(`[charity-navigator-tool] Unexpected error in ${name}:`, err);
    return {
      content: "Unexpected error calling Charity Navigator GraphQL API.",
      is_error: true,
    };
  }
}
