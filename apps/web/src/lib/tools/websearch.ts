/**
 * Web search tool for the development director (and other archetypes that need it).
 *
 * Uses Brave Search API when BRAVE_SEARCH_API_KEY is set in env.
 * Falls back to a descriptive "not configured" error if the key is missing —
 * we never want to silently return stale or hallucinated results.
 *
 * Register at https://brave.com/search/api/ (free tier: 2k queries/month).
 * Set BRAVE_SEARCH_API_KEY in .env.local / Vercel env vars.
 *
 * Primary use: development director searching community foundations, corporate
 * giving programs, local funders, and philanthropic databases beyond Grants.gov.
 */

import type Anthropic from "@anthropic-ai/sdk";

const BRAVE_ENDPOINT = "https://api.search.brave.com/res/v1/web/search";

// ---------------------------------------------------------------------------
// System-prompt addendum
// ---------------------------------------------------------------------------

export const WEBSEARCH_TOOLS_ADDENDUM = `\nYou have access to web_search for finding grant opportunities beyond Grants.gov — use it to search community foundations, corporate giving programs, private foundations, state-level funders, and philanthropic databases. Good search queries: "[city/state] community foundation grants", "[company] corporate giving program nonprofits", "foundation grants [cause area] deadline [year]". Always cite the source URL in your response so the user can verify. Combine with grants_search for comprehensive coverage.`;

// ---------------------------------------------------------------------------
// Tool definition
// ---------------------------------------------------------------------------

export const webSearchTools: Anthropic.Tool[] = [
  {
    name: "web_search",
    description:
      "Search the web for grant opportunities, funders, and funding news beyond Grants.gov. Use for community foundations, corporate giving programs, private foundations, and state-level funders. Returns titles, URLs, and snippets. Always cite sources in your response.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description:
            "Web search query. Be specific: include geography, cause area, and funder type (e.g. 'Chicago community foundation youth grants 2026', 'Google.org nonprofit grants education').",
        },
        count: {
          type: "number",
          description:
            "Number of results to return (1–10). Defaults to 5. Keep small to conserve context.",
        },
      },
      required: ["query"],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool executor
// ---------------------------------------------------------------------------

export async function executeWebSearchTool({
  name,
  input,
}: {
  name: string;
  input: Record<string, unknown>;
}): Promise<{ content: string; is_error?: boolean }> {
  if (name !== "web_search") {
    return { content: `Unknown web search tool: ${name}`, is_error: true };
  }

  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    return {
      content:
        "Web search is not configured. Ask your administrator to add BRAVE_SEARCH_API_KEY to the environment variables. In the meantime, use grants_search to find federal opportunities on Grants.gov.",
      is_error: true,
    };
  }

  if (!input.query || typeof input.query !== "string") {
    return { content: "query is required and must be a string.", is_error: true };
  }

  const count = typeof input.count === "number" ? Math.max(1, Math.min(input.count, 10)) : 5;

  try {
    const url = new URL(BRAVE_ENDPOINT);
    url.searchParams.set("q", input.query);
    url.searchParams.set("count", String(count));
    url.searchParams.set("search_lang", "en");
    url.searchParams.set("result_filter", "web");

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": apiKey,
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return {
        content: `Brave Search error (${response.status}): ${body || response.statusText}`,
        is_error: true,
      };
    }

    const data = (await response.json()) as {
      web?: {
        results?: Array<{
          title?: string;
          url?: string;
          description?: string;
        }>;
      };
    };

    const results = data.web?.results ?? [];

    if (results.length === 0) {
      return {
        content: JSON.stringify({ query: input.query, results: [], message: "No results found. Try a different search query." }),
      };
    }

    const slim = {
      query: input.query,
      returned: results.length,
      results: results.map((r) => ({
        title: r.title ?? "(no title)",
        url: r.url ?? "",
        snippet: r.description ?? "",
      })),
    };

    return { content: JSON.stringify(slim) };
  } catch (err) {
    console.error("[websearch-tool] Unexpected error:", err);
    return {
      content: "Unexpected error calling Brave Search API.",
      is_error: true,
    };
  }
}
