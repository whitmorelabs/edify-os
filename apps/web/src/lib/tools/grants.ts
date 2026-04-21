/**
 * Anthropic tool definitions and executor for Grants.gov search.
 * Two tools: grants_search and grants_get_details.
 * No auth context needed — these are public API calls.
 */

import type Anthropic from "@anthropic-ai/sdk";
import { searchGrants, fetchGrantDetails, GrantsGovError } from "@/lib/grants-gov";

// ---------------------------------------------------------------------------
// System-prompt addendum for archetypes that have grants tools active.
// ---------------------------------------------------------------------------

export const GRANTS_TOOLS_ADDENDUM = `\nYou have access to federal grant search via Grants.gov. Use grants_search when the user asks about funding opportunities, grants for a specific cause, open deadlines, or any question about federal grant programs. Use grants_get_details when the user wants the full description or eligibility details of a specific opportunity. Never make up grant details — always call the tool. Opportunity IDs come from grants_search results.`;

// ---------------------------------------------------------------------------
// Tool definitions (model-facing)
// ---------------------------------------------------------------------------

export const grantsTools: Anthropic.Tool[] = [
  {
    name: "grants_search",
    description:
      "Search federal grant opportunities on Grants.gov by keyword, deadline, eligibility, funding category, or agency. Use when the user asks about funding opportunities, grants for X cause, deadlines in the next N days, open grants, government funding, etc. Returns a list of matching grants with title, agency, deadlines, and award amounts. Defaults to active (forecasted + posted) opportunities.",
    input_schema: {
      type: "object" as const,
      properties: {
        keyword: {
          type: "string",
          description:
            "Search keyword — topic, program name, or cause area (e.g. 'youth mentoring', 'early childhood education', 'food security').",
        },
        oppStatuses: {
          type: "array",
          description:
            "Status filter. Default is ['forecasted', 'posted'] (active opportunities). Include 'closed' or 'archived' only if the user asks about past grants.",
          items: {
            type: "string",
            enum: ["forecasted", "posted", "closed", "archived"],
          },
        },
        deadlineWithinDays: {
          type: "number",
          description:
            "Only return grants with a close date within this many days from today. Useful when the user says 'in the next 60 days', 'upcoming deadlines', etc.",
        },
        eligibilities: {
          type: "array",
          description:
            "Filter by applicant eligibility codes (e.g. 'nonprofits', 'state_governments', 'small_businesses'). Omit to return all.",
          items: { type: "string" },
        },
        fundingCategories: {
          type: "array",
          description:
            "Filter by funding category codes (e.g. 'education', 'health', 'community_development'). Omit to return all.",
          items: { type: "string" },
        },
        agencies: {
          type: "array",
          description:
            "Filter by agency codes (e.g. 'HHS', 'DOE', 'USDA'). Omit to return all agencies.",
          items: { type: "string" },
        },
        rows: {
          type: "number",
          description:
            "Number of results to return (1–50). Defaults to 20. Use a smaller number for quick scans, larger for comprehensive searches.",
        },
        sortBy: {
          type: "string",
          description:
            "Sort order, pipe-separated as 'field|direction'. Default 'closeDate|asc' (soonest deadline first). Other options: 'openDate|desc' (newest posted), 'agency|asc'.",
        },
      },
      required: [],
    },
  },
  {
    name: "grants_get_details",
    description:
      "Fetch the full text, description, eligibility narrative, and complete details of a specific federal grant opportunity by its opportunity ID. Use this after grants_search when the user wants more information about one specific grant. Do not guess opportunity IDs — only use IDs returned from grants_search.",
    input_schema: {
      type: "object" as const,
      properties: {
        opportunityId: {
          type: "string",
          description:
            "The Grants.gov opportunity ID (e.g. '12345'). Must come from a prior grants_search result.",
        },
      },
      required: ["opportunityId"],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool executor
// ---------------------------------------------------------------------------

export async function executeGrantsTool({
  name,
  input,
}: {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: Record<string, unknown>;
}): Promise<{ content: string; is_error?: boolean }> {
  try {
    switch (name) {
      case "grants_search": {
        const rows =
          typeof input.rows === "number" ? Math.min(input.rows, 50) : 20;

        const result = await searchGrants({
          keyword: input.keyword as string | undefined,
          oppStatuses: input.oppStatuses as
            | Array<"forecasted" | "posted" | "closed" | "archived">
            | undefined,
          deadlineWithinDays:
            typeof input.deadlineWithinDays === "number"
              ? input.deadlineWithinDays
              : undefined,
          eligibilities: input.eligibilities as string[] | undefined,
          fundingCategories: input.fundingCategories as string[] | undefined,
          agencies: input.agencies as string[] | undefined,
          rows,
          sortBy: input.sortBy as string | undefined,
        });

        // Project to slim shape — Claude only needs what it'll surface to the user.
        // eligibilityCategories is included so Claude can answer "am I eligible?"
        // without N follow-up grants_get_details calls.
        const slim = {
          total: result.total,
          returned: result.grants.length,
          grants: result.grants.map((g) => ({
            opportunityId: g.opportunityId,
            opportunityNumber: g.opportunityNumber,
            title: g.title,
            agency: g.agency,
            status: g.status,
            closeDate: g.closeDate,
            awardCeiling: g.awardCeiling,
            awardFloor: g.awardFloor,
            fundingInstrumentTypes: g.fundingInstrumentTypes,
            eligibilityCategories: g.eligibilityCategories,
          })),
        };

        return { content: JSON.stringify(slim) };
      }

      case "grants_get_details": {
        if (!input.opportunityId || typeof input.opportunityId !== "string") {
          return {
            content: "opportunityId is required and must be a string.",
            is_error: true,
          };
        }

        const result = await fetchGrantDetails({
          opportunityId: input.opportunityId,
        });

        // Return full detail — this is the deep-dive call, so include description.
        return { content: JSON.stringify(result.grant) };
      }

      default:
        return {
          content: `Unknown grants tool: ${name}`,
          is_error: true,
        };
    }
  } catch (err) {
    if (err instanceof GrantsGovError) {
      return {
        content: `Grants.gov error (${err.status}): ${err.message}`,
        is_error: true,
      };
    }
    console.error(`[grants-tool] Unexpected error in ${name}:`, err);
    return {
      content: "Unexpected error calling Grants.gov API.",
      is_error: true,
    };
  }
}
