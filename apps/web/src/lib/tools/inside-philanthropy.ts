/**
 * Anthropic tool definitions and executor for Inside Philanthropy RSS.
 * One tool: inside_philanthropy_recent.
 *
 * Why this is wired:
 *   Inside Philanthropy publishes editorial coverage of foundation news,
 *   funder profiles, and philanthropy-sector trends. The free RSS feed
 *   gives us the "what's happening NOW" signal that our structured 990-PF
 *   parser cannot — 990s lag 12-18 months behind reality, but RSS items
 *   are minutes-to-hours old.
 *
 * IMPORTANT for the model:
 *   This is a NEWS / SIGNAL source, NOT a structured grant opportunity
 *   catalog. The model should treat each item as a *breadcrumb* to
 *   investigate via ProPublica, charity_navigator, or
 *   foundation_grants_paid_by_ein — never as a direct grant-finding result
 *   the user can apply to. Inside Philanthropy itself paywalls full
 *   article content; the RSS exposes only headline + short description.
 *
 * No env var required — the feed is public.
 */

import type Anthropic from "@anthropic-ai/sdk";
import {
  getInsidePhilanthropyRecent,
  InsidePhilanthropyError,
  DEFAULT_IP_LIMIT,
  MAX_IP_LIMIT,
} from "@/lib/inside-philanthropy";

// ---------------------------------------------------------------------------
// System-prompt addendum.
// ---------------------------------------------------------------------------

export const INSIDE_PHILANTHROPY_TOOLS_ADDENDUM = `\nYou have access to inside_philanthropy_recent, which fetches the latest items from Inside Philanthropy's free public RSS feed — foundation news, funder profiles, philanthropy-sector trends. This is a NEWS / SIGNAL source, NOT a structured grant opportunity catalog. Treat each result as a *breadcrumb to investigate*, not as a grant the user can apply to: when an item names a foundation that's relevant to the user's mission, chain into nonprofit_search (ProPublica) for the EIN + financials, charity_navigator_search for ratings, and foundation_grants_paid_by_ein for the recipient graph. Inside Philanthropy paywalls full article content; the RSS only exposes headline + a short publisher-truncated description. Use the optional 'keyword' parameter (case-insensitive contains-match against title + description) to narrow to a topic area like 'youth' or 'climate'. Always cite the link so the user can read the original article. Items are recent — typically the last 1-2 weeks of editorial output. The feed mixes time-sensitive news posts ('Toplines', 'X foundation announces Y') with steady-state 'Grants P/Q/R' foundation profile pages — both useful, but call out the difference when relevant.`;

// ---------------------------------------------------------------------------
// Tool definitions (model-facing)
// ---------------------------------------------------------------------------

export const insidePhilanthropyTools: Anthropic.Tool[] = [
  {
    name: "inside_philanthropy_recent",
    description:
      "Fetch recent items from Inside Philanthropy's public RSS feed — foundation news, funder profiles, philanthropy-sector editorial. Returns the last ~10-20 published items with title, link, pubDate, description (HTML-stripped, ~600 chars), categories, and creator. Use when the user wants 'what's happening in philanthropy right now', 'is anyone writing about [foundation X]', or 'recent news on [topic] giving'. Optional keyword filter (case-insensitive) narrows results in-memory after fetch. IMPORTANT: this is a NEWS / SIGNAL source — items are breadcrumbs to investigate via nonprofit_search / charity_navigator_search / foundation_grants_paid_by_ein, NOT structured grant opportunities the user can apply to. Inside Philanthropy paywalls full article content; only headline + short description are in the RSS.",
    input_schema: {
      type: "object" as const,
      properties: {
        keyword: {
          type: "string",
          description:
            "Optional case-insensitive contains-match against title + description (e.g. 'youth', 'climate', 'Ford'). Filters in-memory after fetch — does not narrow the feed itself.",
        },
        limit: {
          type: "number",
          description: `Max items to return (1-${MAX_IP_LIMIT}). Defaults to ${DEFAULT_IP_LIMIT}.`,
        },
      },
      required: [],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool executor
// ---------------------------------------------------------------------------

export async function executeInsidePhilanthropyTool({
  name,
  input,
}: {
  name: string;
  input: Record<string, unknown>;
}): Promise<{ content: string; is_error?: boolean }> {
  try {
    switch (name) {
      case "inside_philanthropy_recent": {
        const result = await getInsidePhilanthropyRecent({
          keyword:
            typeof input.keyword === "string" ? input.keyword : undefined,
          limit:
            typeof input.limit === "number" && Number.isFinite(input.limit)
              ? input.limit
              : undefined,
        });
        return {
          content: JSON.stringify({
            feedTitle: result.feedTitle,
            totalInFeed: result.totalInFeed,
            returned: result.items.length,
            items: result.items,
          }),
        };
      }

      default:
        return {
          content: `Unknown Inside Philanthropy tool: ${name}`,
          is_error: true,
        };
    }
  } catch (err) {
    if (err instanceof InsidePhilanthropyError) {
      return {
        content: `Inside Philanthropy error (${err.status}): ${err.message}`,
        is_error: true,
      };
    }
    console.error(
      `[inside-philanthropy-tool] Unexpected error in ${name}:`,
      err,
    );
    return {
      content: "Unexpected error fetching Inside Philanthropy RSS.",
      is_error: true,
    };
  }
}
