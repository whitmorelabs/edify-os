/**
 * Web search — uses Claude's native web_search server tool.
 *
 * Anthropic handles the search on their servers (via Brave Search).
 * No external API key needed — cost is $10 per 1,000 searches,
 * billed to the user's Anthropic API key automatically.
 *
 * This is a server tool, not a custom function tool — it gets added
 * to the tools array with type "web_search_20250305" and Anthropic
 * executes it automatically during the message loop.
 */

// System-prompt addendum telling the agent it can search the web
export const WEBSEARCH_TOOLS_ADDENDUM = `\nYou have access to web search for finding information beyond your training data — use it to search community foundations, corporate giving programs, private foundations, state-level funders, philanthropic databases, and any other online resources. Good search queries: "[city/state] community foundation grants", "[company] corporate giving program nonprofits", "foundation grants [cause area] deadline [year]". Always cite the source URL in your response so the user can verify.`;

/**
 * Claude's native web search server tool definition.
 * Added to the tools array — Anthropic handles execution server-side.
 */
export const webSearchServerTool = {
  type: "web_search_20250305" as const,
  name: "web_search",
  max_uses: 5,
};

// No custom tools or executor needed — Claude handles web search natively.
// These empty exports maintain compatibility with the registry imports.
export const webSearchTools: { name: string }[] = [];
export function executeWebSearchTool(_args?: { name: string; input: unknown }): never {
  throw new Error("Web search is a server tool — executed by Anthropic, not locally");
}
