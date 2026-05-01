/**
 * Anthropic tool definitions and executor for ProPublica Nonprofit Explorer.
 * Two tools: nonprofit_search and nonprofit_get_details.
 * No auth context needed — these are public API calls.
 *
 * Used by Development Director for funder due diligence:
 *   - "Has Foundation X funded similar orgs to ours? At what amounts?"
 *   - "What's the financial health of this foundation?"
 *   - "Who else does this kind of work in our state?"
 */

import type Anthropic from "@anthropic-ai/sdk";
import {
  searchNonprofits,
  getNonprofit,
  ProPublicaNonprofitError,
  NTEE_MAJOR_GROUPS,
} from "@/lib/propublica-nonprofits";

// ---------------------------------------------------------------------------
// System-prompt addendum for archetypes that have nonprofit tools active.
// ---------------------------------------------------------------------------

const NTEE_HINT = Object.entries(NTEE_MAJOR_GROUPS)
  .map(([id, label]) => `${id}=${label}`)
  .join(", ");

export const NONPROFIT_TOOLS_ADDENDUM = `\nYou have access to ProPublica's Nonprofit Explorer for funder due diligence and peer benchmarking. Use nonprofit_search to find foundations, peer nonprofits, or specific orgs by name (optionally narrowed by state and NTEE major group). Use nonprofit_get_details to pull a specific org's recent 990 filings — total revenue, assets, officer compensation, and (for private foundations on 990-PF) total grants paid. Filing data lags 6–12 months behind the current funding cycle, so use this for historical funder behavior and financial health, not for "what's open right now" (that's grants_search). NTEE major groups: ${NTEE_HINT}. Always cite the EIN you used and never invent EINs — pull them from nonprofit_search results.`;

// ---------------------------------------------------------------------------
// Tool definitions (model-facing)
// ---------------------------------------------------------------------------

export const nonprofitTools: Anthropic.Tool[] = [
  {
    name: "nonprofit_search",
    description:
      "Search the ProPublica Nonprofit Explorer for US 501(c) organizations by name (with optional state and NTEE major-group filters). Use when the user asks about a specific foundation by name, wants to find peer nonprofits in their cause area, or needs to identify funders that work in a particular state or program category. Returns up to N matches with EIN, legal name, city, state, NTEE code, and IRS subsection code (3 = 501(c)(3)). Backed by IRS Form 990 data — comprehensive but lags ~6–12 months on filings.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description:
            "Free-text search — typically a foundation name (e.g. 'Ford Foundation'), partial name, or cause keyword (e.g. 'youth mentoring'). Required.",
        },
        state: {
          type: "string",
          description:
            "Two-letter USPS state code to narrow results (e.g. 'NY', 'CA'). Use 'ZZ' for international orgs that file 990s. Omit to search nationwide.",
        },
        nteeMajorGroup: {
          type: "number",
          description:
            "NTEE major-group ID (1–10) to narrow results by program area. 1 = Arts/Culture, 2 = Education, 3 = Environment/Animals, 4 = Health, 5 = Human Services, 6 = International, 7 = Public/Societal Benefit, 8 = Religion, 9 = Mutual/Membership, 10 = Unclassified. Omit to search all categories.",
          enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        },
        limit: {
          type: "number",
          description:
            "Number of results to return (1–25). Defaults to 10. Use a smaller number for quick scans, larger for comprehensive searches.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "nonprofit_get_details",
    description:
      "Fetch the full ProPublica profile for a specific nonprofit by EIN — including header info (legal name, address, NTEE code, 501(c) subsection) plus a summary of the most recent IRS Form 990 filings (total revenue, total expenses, total assets, officer compensation, and for private foundations on 990-PF: total grants paid). Use after nonprofit_search to deep-dive on a foundation's financial health, historical giving trends, or to confirm 501(c)(3) status. Do not guess EINs — only use EINs returned from nonprofit_search.",
    input_schema: {
      type: "object" as const,
      properties: {
        ein: {
          type: "string",
          description:
            "The org's IRS Employer Identification Number, accepted in either '13-1684331' or '131684331' form. Must come from a prior nonprofit_search result.",
        },
        filingsLimit: {
          type: "number",
          description:
            "How many recent filings to return (1–10). Defaults to 5 — most recent first. Use a higher number when the user wants multi-year giving trends; lower for a quick health-check.",
        },
      },
      required: ["ein"],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool executor
// ---------------------------------------------------------------------------

export async function executeNonprofitTool({
  name,
  input,
}: {
  name: string;
  input: Record<string, unknown>;
}): Promise<{ content: string; is_error?: boolean }> {
  try {
    switch (name) {
      case "nonprofit_search": {
        const query = typeof input.query === "string" ? input.query : "";
        if (!query.trim()) {
          return {
            content: "query is required and must be a non-empty string.",
            is_error: true,
          };
        }
        const limit =
          typeof input.limit === "number"
            ? Math.max(1, Math.min(input.limit, 25))
            : 10;

        const result = await searchNonprofits({
          query,
          state: typeof input.state === "string" ? input.state : undefined,
          nteeMajorGroup:
            typeof input.nteeMajorGroup === "number"
              ? input.nteeMajorGroup
              : undefined,
          limit,
        });

        // Project to slim shape — Claude only needs what it'll surface to the user.
        const slim = {
          total: result.total,
          returned: result.orgs.length,
          orgs: result.orgs,
        };
        return { content: JSON.stringify(slim) };
      }

      case "nonprofit_get_details": {
        if (!input.ein || typeof input.ein !== "string") {
          return {
            content: "ein is required and must be a string.",
            is_error: true,
          };
        }
        const filingsLimit =
          typeof input.filingsLimit === "number"
            ? Math.max(1, Math.min(input.filingsLimit, 10))
            : 5;

        const result = await getNonprofit({ ein: input.ein, filingsLimit });
        return { content: JSON.stringify(result.org) };
      }

      default:
        return {
          content: `Unknown nonprofit tool: ${name}`,
          is_error: true,
        };
    }
  } catch (err) {
    if (err instanceof ProPublicaNonprofitError) {
      return {
        content: `ProPublica Nonprofit Explorer error (${err.status}): ${err.message}`,
        is_error: true,
      };
    }
    console.error(`[nonprofit-tool] Unexpected error in ${name}:`, err);
    return {
      content: "Unexpected error calling ProPublica Nonprofit Explorer API.",
      is_error: true,
    };
  }
}
