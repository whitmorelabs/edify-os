/**
 * MCP server registry — maps each archetype to the MCP servers it should have
 * access to during a chat turn.
 *
 * MCP servers are passed via the `mcp_servers` param in the Anthropic API call.
 * Each entry describes one server: its name, URL, and (optionally) the name of
 * the environment variable holding the OAuth access token.
 *
 * Sprint 1 (ingestion spike):
 *   - Marketing Director gets Slack for smoke testing.
 *   - All other archetypes are empty.
 *   - Token sourcing: env var fallback (SLACK_MCP_OAUTH_TOKEN) — no OAuth UI yet.
 *     The OAuth UI and the mcp_connections table are wired up in Sprint 2.
 *
 * Sprint 2 will add:
 *   - Per-org token lookup from the mcp_connections Supabase table.
 *   - An admin UI where users connect their own Slack/Notion/etc accounts.
 *   - Additional archetypes (events_director → Google Calendar MCP, etc.).
 */

import type { ArchetypeSlug } from "@/lib/archetypes";

/** Shape of one MCP server config passed to the Anthropic API. */
export interface MCPServerConfig {
  /** Server identifier used by the model to route tool calls. */
  name: string;
  /** SSE endpoint URL for this MCP server. */
  url: string;
  /**
   * Name of the environment variable containing the OAuth bearer token.
   * When present, the runtime injects `Authorization: Bearer <value>` into
   * the MCP connection headers. If the env var is unset, the server entry
   * is excluded from the API call to avoid passing blank tokens.
   */
  oauthTokenEnv?: string;
}

/**
 * Static MCP server definitions per archetype.
 *
 * IMPORTANT: This is the STATIC config — URLs and server names only.
 * Actual tokens are resolved at call time by buildMcpServersForOrg()
 * below, which looks up per-org tokens from the mcp_connections table
 * (Sprint 2) or falls back to env vars (Sprint 1).
 */
const ARCHETYPE_MCP_CONFIG: Record<ArchetypeSlug, MCPServerConfig[]> = {
  marketing_director: [
    {
      name: "slack",
      // Anthropic-hosted Slack MCP proxy (SSE endpoint).
      // See: https://github.com/anthropics/knowledge-work-plugins for the MCP URL list.
      url: "https://mcp.slack.com/sse",
      oauthTokenEnv: "SLACK_MCP_OAUTH_TOKEN",
    },
  ],

  // Sprint 1: empty for all other archetypes.
  executive_assistant: [],
  events_director: [],
  development_director: [],
  programs_director: [],
  hr_volunteer_coordinator: [],
};

/**
 * Resolved MCP server entry ready to be passed to the Anthropic API.
 * Matches the SDK's BetaRequestMCPServerURLDefinition shape.
 * Token is already resolved — do not log this object.
 */
export interface ResolvedMCPServer {
  /** Required by the Anthropic API: discriminator for URL-based MCP servers. */
  type: "url";
  name: string;
  url: string;
  authorization_token?: string;
}

/**
 * Build the resolved MCP server list for a given archetype + org.
 *
 * Sprint 1 strategy:
 *   1. Try to fetch token from the mcp_connections table for this org + server_name.
 *   2. Fall back to the environment variable named in oauthTokenEnv.
 *   3. Exclude the server entirely if no token is found (prevents sending blank auth).
 *
 * Sprint 2 will replace step 1 with a real DB lookup once the mcp_connections
 * migration is applied and the OAuth UI is wired up.
 *
 * @param archetype  The archetype slug for this chat turn.
 * @param _orgId     The org UUID (unused in Sprint 1; will query mcp_connections in Sprint 2).
 * @returns          Array of resolved server configs ready for the API call.
 */
export async function buildMcpServersForOrg(
  archetype: ArchetypeSlug,
  _orgId: string,
): Promise<ResolvedMCPServer[]> {
  const configs = ARCHETYPE_MCP_CONFIG[archetype] ?? [];
  if (configs.length === 0) return [];

  const resolved: ResolvedMCPServer[] = [];

  for (const cfg of configs) {
    let token: string | undefined;

    // Sprint 2: replace this block with a Supabase lookup:
    //   const { data } = await serviceClient
    //     .from("mcp_connections")
    //     .select("access_token")
    //     .eq("org_id", orgId)
    //     .eq("server_name", cfg.name)
    //     .maybeSingle();
    //   token = data?.access_token ?? undefined;

    // Sprint 1 fallback: read from environment variable.
    if (!token && cfg.oauthTokenEnv) {
      token = process.env[cfg.oauthTokenEnv] ?? undefined;
    }

    if (!token) {
      // No token available — skip this server rather than sending a blank auth header.
      // The archetype will still function; it just won't have MCP access for this server.
      continue;
    }

    resolved.push({
      type: "url",
      name: cfg.name,
      url: cfg.url,
      authorization_token: token,
    });
  }

  return resolved;
}

/**
 * Re-export the static config for introspection / admin UI use.
 * Use buildMcpServersForOrg() in the chat path — this export is for
 * listing configured servers without resolving tokens.
 */
export const ARCHETYPE_MCP_SERVERS = ARCHETYPE_MCP_CONFIG;
