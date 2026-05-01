/**
 * Anthropic tool definitions and executor for USAspending.gov.
 * Two tools:
 *   - usaspending_search_awards    — federal awards (grants/contracts/loans/etc.)
 *   - usaspending_recipient_profile — single-recipient totals + activity
 *
 * No auth context needed — these are public API calls.
 *
 * Used by Development Director for federal-funding landscape research:
 *   - "Who has been awarded HHS youth-program grants in NY in 2024?"
 *   - "What does Foundation X's federal-grant history look like?"
 *   - "What's the average award size in our space and who are the top recipients?"
 */

import type Anthropic from "@anthropic-ai/sdk";
import {
  searchFederalAwards,
  findRecipients,
  getRecipientProfile,
  USAspendingError,
  type AwardTypeGroup,
} from "@/lib/usaspending";

const VALID_AWARD_TYPE_GROUPS = new Set<AwardTypeGroup>([
  "grants",
  "loans",
  "contracts",
  "direct_payments",
  "all_assistance",
]);

const VALID_RECIPIENT_AWARD_TYPES = new Set([
  "all",
  "grants",
  "loans",
  "contracts",
  "direct_payments",
] as const);
type RecipientAwardType =
  typeof VALID_RECIPIENT_AWARD_TYPES extends Set<infer T> ? T : never;

// ---------------------------------------------------------------------------
// System-prompt addendum for archetypes that have USAspending tools active.
// ---------------------------------------------------------------------------

export const USASPENDING_TOOLS_ADDENDUM = `\nYou have access to USAspending.gov for federal-award history. Use usaspending_search_awards to find who has actually been awarded federal grants in a space (filter by recipient name, state, keyword, time window, and award type — defaults to grants). This complements grants_search (which shows what's *open*) by showing what's *been won*. Use usaspending_recipient_profile to deep-dive a specific recipient — pass the recipientId returned from a search via the recipient hit's lookup pattern (search awards → note recipient name → call usaspending_search_awards or report what you found). Award data covers 2007-10-01 onward. Results are capped at 10 per call to keep context tight; narrow filters or paginate via tighter date windows if the user wants more. Always cite specific awards (Award ID, recipient, agency, amount) — never invent numbers.`;

// ---------------------------------------------------------------------------
// Tool definitions (model-facing)
// ---------------------------------------------------------------------------

export const usaspendingTools: Anthropic.Tool[] = [
  {
    name: "usaspending_search_awards",
    description:
      "Search the USAspending.gov federal-awards database for actual grants, cooperative agreements, loans, or contracts that were awarded. Use when the user asks 'who has historically won this kind of federal funding?', 'what's our funding-landscape look like?', or 'what's the average award size for [agency/topic] grants?'. Returns up to 10 matching awards (sorted by amount desc) with recipient name, award amount, awarding agency/sub-agency, dates, and a description excerpt. Award data goes back to 2007-10-01. Default award type is grants — pass awardTypeGroup to switch. To find a recipient's profile, first search and note the recipient name.",
    input_schema: {
      type: "object" as const,
      properties: {
        keyword: {
          type: "string",
          description:
            "Free-text keyword across description and recipient (e.g. 'youth mentoring', 'opioid'). Use for topic-driven searches.",
        },
        recipientName: {
          type: "string",
          description:
            "Recipient name substring (e.g. 'Boys & Girls Clubs of America'). Use to find awards to a specific organization.",
        },
        placeOfPerformanceState: {
          type: "string",
          description:
            "Two-letter USPS state code where the work is performed (e.g. 'NY', 'CA'). Filters to awards executed in that state.",
        },
        awardTypeGroup: {
          type: "string",
          description:
            "Award type group. 'grants' (default — block/formula/project/cooperative agreement), 'loans' (direct loans + guarantees), 'contracts' (federal acquisition contracts A-D), 'direct_payments' (specified or unrestricted use), or 'all_assistance' (all financial-assistance types).",
          enum: [
            "grants",
            "loans",
            "contracts",
            "direct_payments",
            "all_assistance",
          ],
        },
        startDate: {
          type: "string",
          description:
            "ISO date (YYYY-MM-DD) — filter window start. Earliest accepted: 2007-10-01. Defaults to 2 years ago.",
        },
        endDate: {
          type: "string",
          description:
            "ISO date (YYYY-MM-DD) — filter window end. Defaults to today.",
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
    name: "usaspending_recipient_profile",
    description:
      "Find a federal recipient by keyword (name, UEI, or DUNS) and return their summary profile — total transaction amount across all federal awards, total transaction count, total loan face value, business types, and address. Use for 'tell me about this funder/recipient' due-diligence questions. Returns up to 5 matching recipients ranked by total amount desc (use limit to widen). Cited recipient names should always come from this tool, not be invented.",
    input_schema: {
      type: "object" as const,
      properties: {
        keyword: {
          type: "string",
          description:
            "Recipient name keyword (e.g. 'Research Foundation Mental Hygiene'), UEI, or DUNS. Required.",
        },
        limit: {
          type: "number",
          description: "Number of matching recipients to return (1–10). Defaults to 5.",
        },
        awardType: {
          type: "string",
          description:
            "Filter recipients by award type. 'all' (default), 'grants', 'loans', 'contracts', or 'direct_payments'.",
          enum: ["all", "grants", "loans", "contracts", "direct_payments"],
        },
      },
      required: ["keyword"],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool executor
// ---------------------------------------------------------------------------

export async function executeUSAspendingTool({
  name,
  input,
}: {
  name: string;
  input: Record<string, unknown>;
}): Promise<{ content: string; is_error?: boolean }> {
  try {
    switch (name) {
      case "usaspending_search_awards": {
        const limit =
          typeof input.limit === "number"
            ? Math.max(1, Math.min(input.limit, 10))
            : 10;

        const result = await searchFederalAwards({
          keyword: typeof input.keyword === "string" ? input.keyword : undefined,
          recipientName:
            typeof input.recipientName === "string"
              ? input.recipientName
              : undefined,
          placeOfPerformanceState:
            typeof input.placeOfPerformanceState === "string"
              ? input.placeOfPerformanceState
              : undefined,
          awardTypeGroup:
            typeof input.awardTypeGroup === "string" &&
            VALID_AWARD_TYPE_GROUPS.has(input.awardTypeGroup as AwardTypeGroup)
              ? (input.awardTypeGroup as AwardTypeGroup)
              : undefined,
          startDate:
            typeof input.startDate === "string" ? input.startDate : undefined,
          endDate: typeof input.endDate === "string" ? input.endDate : undefined,
          limit,
        });

        return {
          content: JSON.stringify({
            returned: result.awards.length,
            hasMore: result.hasMore,
            awards: result.awards,
          }),
        };
      }

      case "usaspending_recipient_profile": {
        const keyword = typeof input.keyword === "string" ? input.keyword : "";
        if (!keyword.trim()) {
          return {
            content: "keyword is required and must be a non-empty string.",
            is_error: true,
          };
        }
        const limit =
          typeof input.limit === "number"
            ? Math.max(1, Math.min(input.limit, 10))
            : 5;
        const awardType: RecipientAwardType =
          typeof input.awardType === "string" &&
          (VALID_RECIPIENT_AWARD_TYPES as Set<string>).has(input.awardType)
            ? (input.awardType as RecipientAwardType)
            : "all";

        const search = await findRecipients({ keyword, limit, awardType });

        // If we have at least one hit, also pull the top match's full profile.
        // This collapses the typical "search → pick → fetch" into one round-trip.
        let topProfile: Awaited<
          ReturnType<typeof getRecipientProfile>
        >["recipient"] | null = null;
        if (search.recipients[0]?.recipientId) {
          try {
            const detail = await getRecipientProfile({
              recipientId: search.recipients[0].recipientId,
            });
            topProfile = detail.recipient;
          } catch {
            // Profile fetch is best-effort; surface the search results either way.
            topProfile = null;
          }
        }

        return {
          content: JSON.stringify({
            total: search.total,
            returned: search.recipients.length,
            recipients: search.recipients,
            topRecipientProfile: topProfile,
          }),
        };
      }

      default:
        return {
          content: `Unknown USAspending tool: ${name}`,
          is_error: true,
        };
    }
  } catch (err) {
    if (err instanceof USAspendingError) {
      return {
        content: `USAspending.gov error (${err.status}): ${err.message}`,
        is_error: true,
      };
    }
    console.error(`[usaspending-tool] Unexpected error in ${name}:`, err);
    return {
      content: "Unexpected error calling USAspending.gov API.",
      is_error: true,
    };
  }
}
