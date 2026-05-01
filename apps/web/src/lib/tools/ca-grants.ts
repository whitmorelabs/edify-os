/**
 * Anthropic tool definitions and executor for the California Grants Portal.
 * Two tools:
 *   - ca_grants_search       — search the CA grants dataset
 *   - ca_grants_get_details  — fetch one grant's full record by row id
 *
 * No auth context needed — these are public CKAN datastore calls.
 *
 * First state-level proof-of-concept for the broader state-portal expansion
 * pattern (see project_edify_archetype_roadmap → grant discovery sprints).
 */

import type Anthropic from "@anthropic-ai/sdk";
import {
  searchCaGrants,
  getCaGrant,
  CaGrantsPortalError,
  CA_GRANT_STATUSES,
} from "@/lib/ca-grants-portal";

// ---------------------------------------------------------------------------
// System-prompt addendum for archetypes that have CA Grants tools active.
// ---------------------------------------------------------------------------

const CA_STATUS_HINT = CA_GRANT_STATUSES.join(", ");

export const CA_GRANTS_TOOLS_ADDENDUM = `\nYou have access to the California Grants Portal (data.ca.gov). Use ca_grants_search for state-level grants in California — keyword + status (${CA_STATUS_HINT}; default 'active') + agencyDept filter. The dataset refreshes nightly at 8:45pm Pacific and currently holds ~1,900 grants across all CA state agencies. Use ca_grants_get_details to pull one grant's full purpose, eligibility, and contact info by its rowId from a prior search. Always include the GrantURL in your response so the user can apply directly. This tool only covers CA — do not use for other states. Results are capped at 10; if the user wants a broader sweep, refine the keyword first.`;

// ---------------------------------------------------------------------------
// Tool definitions (model-facing)
// ---------------------------------------------------------------------------

export const caGrantsTools: Anthropic.Tool[] = [
  {
    name: "ca_grants_search",
    description:
      "Search the California Grants Portal — state-level grants from CA state agencies. Use when the user asks about open grants in California specifically (e.g. 'what CA arts grants are open right now?', 'when does the CA youth-mental-health funding deadline hit?', 'what's available from CA Dept of Health Care Services?'). Returns up to 10 matching grants with status, agency, title, deadline, est. amounts, and the application URL. Defaults to status='active' so the model surfaces open grants by default. Dataset refreshes nightly at 8:45pm Pacific.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description:
            "Free-text keyword (e.g. 'youth', 'arts', 'opioid', 'climate'). Matches across title, purpose, description, categories, and other text columns.",
        },
        status: {
          type: "string",
          description:
            "Status filter. 'active' (default — accepting applications now), 'closed' (past deadline), or 'forecasted' (announced but not yet open).",
          enum: ["active", "closed", "forecasted"],
        },
        agencyDept: {
          type: "string",
          description:
            "Exact-match CA state agency/dept name (e.g. 'CA Arts Council', 'Department of Health Care Services'). Case-sensitive — match the value as it appears in prior results.",
        },
        limit: {
          type: "number",
          description:
            "Number of results to return (1–10). Defaults to 10. Capped at 10 to keep context manageable.",
        },
      },
      required: [],
    },
  },
  {
    name: "ca_grants_get_details",
    description:
      "Fetch the full record for a single CA grant by its rowId (the _id from a prior ca_grants_search result). Returns the complete description, purpose, eligibility, geography, funding source, contact info, and submission URLs — without truncation. Use after ca_grants_search when the user wants a deep look at one grant. Do not invent rowIds.",
    input_schema: {
      type: "object" as const,
      properties: {
        rowId: {
          type: "number",
          description:
            "The CKAN _id from a ca_grants_search result. Required.",
        },
      },
      required: ["rowId"],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool executor
// ---------------------------------------------------------------------------

export async function executeCaGrantsTool({
  name,
  input,
}: {
  name: string;
  input: Record<string, unknown>;
}): Promise<{ content: string; is_error?: boolean }> {
  try {
    switch (name) {
      case "ca_grants_search": {
        const limit =
          typeof input.limit === "number"
            ? Math.max(1, Math.min(input.limit, 10))
            : 10;
        const status =
          input.status === "active" ||
          input.status === "closed" ||
          input.status === "forecasted"
            ? input.status
            : undefined;

        const result = await searchCaGrants({
          query: typeof input.query === "string" ? input.query : undefined,
          status,
          agencyDept:
            typeof input.agencyDept === "string" ? input.agencyDept : undefined,
          limit,
        });

        return {
          content: JSON.stringify({
            total: result.total,
            returned: result.grants.length,
            grants: result.grants,
          }),
        };
      }

      case "ca_grants_get_details": {
        if (typeof input.rowId !== "number") {
          return {
            content: "rowId is required and must be a number.",
            is_error: true,
          };
        }

        const result = await getCaGrant({ rowId: input.rowId });
        if (!result.grant) {
          return {
            content: `No CA grant found for rowId ${input.rowId}.`,
            is_error: true,
          };
        }
        return { content: JSON.stringify(result.grant) };
      }

      default:
        return {
          content: `Unknown CA Grants tool: ${name}`,
          is_error: true,
        };
    }
  } catch (err) {
    if (err instanceof CaGrantsPortalError) {
      return {
        content: `CA Grants Portal error (${err.status}): ${err.message}`,
        is_error: true,
      };
    }
    console.error(`[ca-grants-tool] Unexpected error in ${name}:`, err);
    return {
      content: "Unexpected error calling California Grants Portal API.",
      is_error: true,
    };
  }
}
