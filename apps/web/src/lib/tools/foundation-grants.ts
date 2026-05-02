/**
 * Anthropic tool definitions and executor for the foundation grants-paid
 * lookup. One tool: foundation_grants_paid_by_ein.
 *
 * This is the Sprint-2 crown-jewel feature — replicating Candid's
 * "Foundation X gave $50K to Y in 2023" recipient-graph data, the most
 * load-bearing piece of Candid Premier, using free public sources only.
 *
 * Pipeline (see lib/foundation-grants.ts for full detail):
 *   1. ProPublica HTML scrape → IRS e-file object IDs for the EIN
 *   2. GivingTuesday Data Lake S3 fetch → raw 990-PF / 990 XML
 *   3. Custom-regex extraction of Schedule I / 990-PF Part XV grant rows
 *
 * Used by Development Director for prospect research:
 *   - "Has Foundation X given to peer orgs in our space?"
 *   - "What were Ford Foundation's largest 2023 grants?"
 *   - "Which orgs has this foundation funded multiple years in a row?"
 *     (chain multiple year calls)
 *
 * Data lag: 990-PFs are filed 6-18 months after fiscal year end. Most
 * recent data available in mid-2026 is tax year 2023 (some 2024).
 *
 * Truncation: large foundations (Ford, Gates, Hewlett) file thousands of
 * grants per year. We surface top N by amount (default 25, max 50). The
 * tool exposes total counts so the model can tell the user how many were
 * truncated.
 *
 * No env var required — all data sources are anonymous public.
 */

import type Anthropic from "@anthropic-ai/sdk";
import {
  getFoundationGrants,
  FoundationGrantsError,
  DEFAULT_GRANTS_LIMIT,
  MAX_GRANTS_LIMIT,
} from "@/lib/foundation-grants";

// ---------------------------------------------------------------------------
// System-prompt addendum.
// ---------------------------------------------------------------------------

export const FOUNDATION_GRANTS_TOOLS_ADDENDUM = `\nYou have access to foundation_grants_paid_by_ein, which extracts the list of grants a foundation paid out in a given tax year — replicating Candid's "Foundation X gave $50K to Y" recipient-graph data using free public IRS data (GivingTuesday's 990 Data Lake). Pass a foundation EIN (chain after nonprofit_search or charity_navigator_search) and optionally a tax year. Returns top grants by amount: recipient name, amount, purpose, address, and EIN if reported. IMPORTANT caveats to surface to the user: (1) Data lag is 12-18 months — 990-PF filings only show up after a fiscal year ends and gets processed; in mid-2026 the most recent available data is typically tax year 2023, sometimes 2024. (2) Results are truncated to top N by amount (default 25, max 50) — surface totalGrantsInFiling and totalGrantsAmount so the user knows how much is hidden. (3) 990-PF Part XV (private foundation grants paid) RARELY includes recipient EIN — only ~1% of rows have one. 990 Schedule I (public charity grants) usually does. (4) The first call for an EIN takes 3-10 sec because the underlying XML is fetched from S3 on demand. Always cite the foundationName, taxYear, and pdfUrl in your response so the user can verify against the original 990 filing.`;

// ---------------------------------------------------------------------------
// Tool definitions (model-facing)
// ---------------------------------------------------------------------------

export const foundationGrantsTools: Anthropic.Tool[] = [
  {
    name: "foundation_grants_paid_by_ein",
    description:
      "Look up the grants a foundation paid out in a given tax year — recipient name, amount, purpose, EIN if reported. Replicates Candid's funder→recipient graph for free using IRS 990-PF Part XV / 990 Schedule I data via GivingTuesday's public S3 mirror. Top results by amount (default 25, max 50). Use after you have a foundation EIN (from nonprofit_search, charity_navigator_search, or user input). Data lags 12-18 months — most-recent year as of mid-2026 is typically 2023. Recipient EIN is usually missing on 990-PF rows; do not assume an EIN match — match by name and address. First call per EIN takes 3-10 sec (S3 fetch + parse). If no filing found for the requested year, the tool lists available years.",
    input_schema: {
      type: "object" as const,
      properties: {
        ein: {
          type: "string",
          description:
            "Foundation EIN — accepted in either '13-1684331' or '131684331' form. Required.",
        },
        year: {
          type: "number",
          description:
            "Tax year (e.g. 2023). If omitted, uses the most recent available filing. Note: 990-PF data lags 12-18 months after fiscal year end.",
        },
        limit: {
          type: "number",
          description: `Cap on grants returned (top N by amount). Defaults to ${DEFAULT_GRANTS_LIMIT}, capped at ${MAX_GRANTS_LIMIT}. Use lower limits for chat brevity.`,
        },
      },
      required: ["ein"],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool executor
// ---------------------------------------------------------------------------

export async function executeFoundationGrantsTool({
  name,
  input,
}: {
  name: string;
  input: Record<string, unknown>;
}): Promise<{ content: string; is_error?: boolean }> {
  try {
    switch (name) {
      case "foundation_grants_paid_by_ein": {
        const ein = typeof input.ein === "string" ? input.ein : "";
        if (!ein.trim()) {
          return {
            content: "ein is required and must be a non-empty string.",
            is_error: true,
          };
        }
        const year =
          typeof input.year === "number" && Number.isFinite(input.year)
            ? input.year
            : undefined;
        const limit =
          typeof input.limit === "number" && Number.isFinite(input.limit)
            ? input.limit
            : undefined;

        const result = await getFoundationGrants({ ein, year, limit });
        return { content: JSON.stringify(result) };
      }

      default:
        return {
          content: `Unknown foundation grants tool: ${name}`,
          is_error: true,
        };
    }
  } catch (err) {
    if (err instanceof FoundationGrantsError) {
      return {
        content: `Foundation grants lookup error (${err.status}): ${err.message}`,
        is_error: true,
      };
    }
    console.error(`[foundation-grants-tool] Unexpected error in ${name}:`, err);
    return {
      content: "Unexpected error fetching foundation grants data.",
      is_error: true,
    };
  }
}
