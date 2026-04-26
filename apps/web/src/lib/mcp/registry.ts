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
 *
 * Sprint 2 (this update):
 *   - Canva added to Marketing Director MCP config.
 *   - buildMcpServersForOrg() now performs per-org DB lookup from mcp_connections
 *     for Canva (with auto-refresh via canva-oauth.ts). Slack retains env-var fallback.
 *   - Graceful degradation: if an org has no Canva connection, the MCP server entry
 *     is omitted from the API call — Kida still works, just without Canva tools.
 *
 * NOTE — Canva MCP server URL:
 *   Canva's production MCP SSE endpoint for third-party apps is not yet publicly
 *   documented as of Sprint 2 (2026-04-25). The CANVA_MCP_URL env var is a
 *   placeholder for when Canva ships a stable MCP endpoint. The OAuth infrastructure
 *   (token storage, refresh, UI) is fully wired now so enabling it requires only
 *   setting CANVA_MCP_URL in the environment. The Canva AI Connector (canva.com/help/
 *   mcp-agent-setup) is a developer-tooling server, not a production API endpoint.
 *   See SMOKE-TEST-NEXT-STEPS-SPRINT-2-AGENT-2.md for follow-up steps.
 */

import type { ArchetypeSlug } from "@/lib/archetypes";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getValidCanvaAccessToken, CANVA_SERVER_NAME } from "@/lib/mcp/canva-oauth";

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
  /**
   * When true, the token for this server is looked up per-org from mcp_connections
   * (with auto-refresh) rather than from an env var.
   */
  useOrgToken?: boolean;
}

/**
 * Static MCP server definitions per archetype.
 *
 * IMPORTANT: This is the STATIC config — URLs and server names only.
 * Actual tokens are resolved at call time by buildMcpServersForOrg()
 * below, which looks up per-org tokens from the mcp_connections table
 * (Sprint 2 DB path) or falls back to env vars (Sprint 1 / Slack path).
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
    {
      // Canva MCP — per-org OAuth token stored in mcp_connections.
      // URL is read from CANVA_MCP_URL env var. If unset, this entry is skipped
      // (Canva has not yet published a stable production MCP SSE endpoint as of Sprint 2).
      // Set CANVA_MCP_URL once Canva publishes a stable production MCP SSE endpoint.
      name: CANVA_SERVER_NAME,
      url: process.env.CANVA_MCP_URL ?? "",
      useOrgToken: true,
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
 * Resolution strategy per server entry:
 *   1. If useOrgToken=true: look up per-org token from mcp_connections (with auto-refresh).
 *      If the org has no connection for this server, skip gracefully.
 *   2. Otherwise: fall back to the environment variable named in oauthTokenEnv.
 *   3. If no URL is configured (e.g. CANVA_MCP_URL not set), skip the server.
 *   4. Exclude the server entirely if no token is found (prevents blank auth headers).
 *
 * @param archetype  The archetype slug for this chat turn.
 * @param orgId      The org UUID — used for per-org mcp_connections lookups.
 * @returns          Array of resolved server configs ready for the API call.
 */
export async function buildMcpServersForOrg(
  archetype: ArchetypeSlug,
  orgId: string,
): Promise<ResolvedMCPServer[]> {
  const configs = ARCHETYPE_MCP_CONFIG[archetype] ?? [];
  if (configs.length === 0) return [];

  const resolved: ResolvedMCPServer[] = [];

  for (const cfg of configs) {
    // Skip entries with no URL configured (e.g. CANVA_MCP_URL not yet set in env)
    if (!cfg.url) continue;

    let token: string | undefined;

    if (cfg.useOrgToken) {
      // Per-org token lookup from mcp_connections (Sprint 2 DB path)
      const serviceClient = createServiceRoleClient();
      if (serviceClient) {
        const result = await getValidCanvaAccessToken(serviceClient, orgId);
        if ("accessToken" in result) {
          token = result.accessToken;
        } else if ("notConnected" in result) {
          // Org has not connected Canva — skip gracefully.
          // Kida still functions; she just won't have Canva MCP tools available.
          continue;
        } else {
          // Token error (expired with no refresh token, DB error, etc.) — log and skip.
          console.warn(
            `[mcp/registry] ${cfg.name} token error for org ${orgId}: ${result.error}`
          );
          continue;
        }
      }
    } else if (cfg.oauthTokenEnv) {
      // Env-var fallback (Sprint 1 path for Slack)
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
