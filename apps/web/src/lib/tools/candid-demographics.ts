/**
 * Anthropic tool definitions and executor for Candid's Demographics API.
 * One tool: candid_demographics_get — fetch board/staff/leadership DEI data
 * for a single org by EIN.
 *
 * Why this is interesting: ProPublica's 990 endpoints don't expose DEI data
 * (race/ethnicity, gender, sexual orientation, disability) at all. Candid's
 * Demographics API is the only free source for this. Coverage is ~55K orgs
 * that have voluntarily submitted demographic data via their Candid profile.
 *
 * Used by Development Director for prospect-research equity narratives:
 *   - "Does this funder have BIPOC leadership?"
 *   - "What's the board diversity profile of [peer org]?"
 *   - "Does our funder explicitly track demographic data on grantees?"
 *
 * Auth: requires CANDID_DEMOGRAPHICS_API_KEY env var (free, register at
 * developer.candid.org). When missing, surfaces a benign "not configured"
 * message rather than throwing.
 *
 * Data lag: Candid updates demographic submissions roughly quarterly as orgs
 * refresh their Candid profiles. Treat the date_last_modified field as the
 * authoritative freshness signal.
 */

import type Anthropic from "@anthropic-ai/sdk";
import {
  getDemographics,
  CandidDemographicsError,
} from "@/lib/candid-demographics";

// ---------------------------------------------------------------------------
// System-prompt addendum.
// ---------------------------------------------------------------------------

export const CANDID_DEMOGRAPHICS_TOOLS_ADDENDUM = `\nYou have access to Candid's free Demographics API for nonprofit DEI / leadership / board demographic data. Use candid_demographics_get with an EIN to pull race & ethnicity, gender identity, sexual orientation, and disability status breakdowns across board, senior staff, and staff cohorts — including whether the CEO and Co-CEO self-identify within each subcategory. Coverage is ~55,000 orgs that voluntarily submitted demographic data; if the API returns null, the org either doesn't have a record or hasn't submitted demographics. Data freshness lags ~quarterly — surface the dateLastModified field whenever you cite a stat. This is the only free source for this kind of data; ProPublica's 990 endpoints do not expose it. Never infer demographic identity from names or photos — only cite what this API returns.`;

// ---------------------------------------------------------------------------
// Tool definitions (model-facing)
// ---------------------------------------------------------------------------

export const candidDemographicsTools: Anthropic.Tool[] = [
  {
    name: "candid_demographics_get",
    description:
      "Fetch board, senior staff, and staff demographic data for a US nonprofit by EIN, via Candid's free Demographics API. Returns headcounts broken down by race & ethnicity, gender identity, sexual orientation, and disability status, plus whether the CEO/Co-CEO self-identify in each subcategory. Coverage is ~55K orgs that have voluntarily submitted data — many EINs return null, which means 'no demographics on file' (not an error). Only source of this data — ProPublica's 990 doesn't expose it. Data is updated quarterly as orgs refresh their Candid profiles; always cite the dateLastModified timestamp.",
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

export async function executeCandidDemographicsTool({
  name,
  input,
}: {
  name: string;
  input: Record<string, unknown>;
}): Promise<{ content: string; is_error?: boolean }> {
  try {
    switch (name) {
      case "candid_demographics_get": {
        const ein = typeof input.ein === "string" ? input.ein : "";
        if (!ein.trim()) {
          return {
            content: "ein is required and must be a non-empty string.",
            is_error: true,
          };
        }
        const result = await getDemographics({ ein });
        if (!result.profile) {
          return {
            content: JSON.stringify({
              ein,
              found: false,
              note: "No demographic data on file at Candid for this EIN. Coverage is voluntary (~55K of ~1.7M US nonprofits). The org may still exist — try nonprofit_get_details for ProPublica's broader 990 coverage.",
            }),
          };
        }
        return {
          content: JSON.stringify({ ein, found: true, profile: result.profile }),
        };
      }

      default:
        return {
          content: `Unknown Candid Demographics tool: ${name}`,
          is_error: true,
        };
    }
  } catch (err) {
    if (err instanceof CandidDemographicsError) {
      return {
        content: `Candid Demographics API error (${err.status}): ${err.message}`,
        is_error: true,
      };
    }
    console.error(
      `[candid-demographics-tool] Unexpected error in ${name}:`,
      err,
    );
    return {
      content: "Unexpected error calling Candid Demographics API.",
      is_error: true,
    };
  }
}
