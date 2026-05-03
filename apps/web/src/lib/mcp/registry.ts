/**
 * MCP server registry — resolves the per-archetype list of MCP servers ready
 * to be passed to Anthropic's `mcp_servers` parameter.
 *
 * As of MCP-0 Sprint 1 (2026-05-01), this file is a thin runtime resolver on
 * top of `server-catalog.ts` (the static config) + `oauth-factory.ts` (the
 * generic per-org token resolver). Adding a new MCP server is now a config
 * edit in `server-catalog.ts`, not a registry change.
 *
 * Auth resolution per server entry:
 *   1. authMode === "oauth"        — per-org token from mcp_connections (auto-refresh)
 *   2. authMode === "bearer-env"   — single-tenant fallback from process.env
 *   3. authMode === "url-from-env" — URL itself (with embedded secret in path) read
 *                                     from process.env at request time; no header sent
 *   4. authMode === "anonymous"    — no Authorization header sent
 *
 * Graceful degradation: if a server's token can't be resolved (no connection,
 * env var unset, refresh failure), the entry is silently dropped from the
 * `mcp_servers` array. The archetype keeps working — it just doesn't have
 * tools from that server for the turn.
 */

import type { ArchetypeSlug } from "@/lib/archetypes";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getValidAccessToken } from "@/lib/mcp/oauth-factory";
import {
  SERVER_CATALOG,
  listServersForArchetype,
  type ServerCatalogEntry,
} from "@/lib/mcp/server-catalog";

/**
 * Resolved MCP server entry ready to be passed to the Anthropic API.
 * Matches the SDK's BetaRequestMCPServerURLDefinition shape.
 * The token field is already resolved — do not log this object.
 */
export interface ResolvedMCPServer {
  /** Required by Anthropic's API: discriminator for URL-based MCP servers. */
  type: "url";
  name: string;
  url: string;
  authorization_token?: string;
}

/**
 * Build the resolved MCP server list for a given archetype + org.
 *
 * Token resolution is parallelized across all configured servers so that one
 * slow refresh doesn't block the others. Servers that fail to resolve are
 * dropped from the result; the chat turn proceeds without them.
 */
export async function buildMcpServersForOrg(
  archetype: ArchetypeSlug,
  orgId: string,
): Promise<ResolvedMCPServer[]> {
  const entries = listServersForArchetype(archetype);
  if (entries.length === 0) return [];

  // Hoist the service-role client out of the per-entry loop — it's a single
  // shared instance and re-creating it per server is wasted work.
  const oauthEntries = entries.filter((e) => e.authMode === "oauth");
  const serviceClient = oauthEntries.length > 0 ? createServiceRoleClient() : null;

  // Resolve one server entry to either a ResolvedMCPServer or null (skip).
  const resolveOne = async (entry: ServerCatalogEntry): Promise<ResolvedMCPServer | null> => {
    let token: string | undefined;
    let url = entry.url;

    if (entry.authMode === "oauth") {
      if (!serviceClient) return null; // DB unavailable — skip rather than send blank auth
      const result = await getValidAccessToken(serviceClient, orgId, entry.id);
      if ("accessToken" in result) {
        token = result.accessToken;
      } else if ("notConnected" in result) {
        return null; // Org hasn't connected this server — graceful skip
      } else {
        console.warn(
          `[mcp/registry] ${entry.id} token error for org ${orgId}: ${result.error}`,
        );
        return null;
      }
    } else if (entry.authMode === "bearer-env") {
      token = entry.bearerEnv ? process.env[entry.bearerEnv] : undefined;
      if (!token) return null; // Env var unset — skip rather than send blank auth
    } else if (entry.authMode === "url-from-env") {
      // URL-as-credential (e.g., Zapier MCP "Anthropic API" client). Read the
      // entire URL — including the embedded secret — from process.env. No
      // Authorization header is sent; the URL itself is the credential.
      const fromEnv = entry.urlEnv ? process.env[entry.urlEnv] : undefined;
      if (!fromEnv) return null; // Env var unset — entry already filtered out, but defensive
      url = fromEnv;
    }
    // authMode === "anonymous" → no token, static url

    return {
      type: "url",
      name: entry.id,
      url,
      ...(token ? { authorization_token: token } : {}),
    };
  };

  const settled = await Promise.all(entries.map(resolveOne));
  return settled.filter((s): s is ResolvedMCPServer => s !== null);
}

/**
 * Static catalog accessor for admin / introspection use cases. Token-free —
 * use buildMcpServersForOrg() in the chat path.
 *
 * Returns ARCHETYPE_MCP_SERVERS shape (kept for backward compat with admin
 * tooling that imported the old constant): each archetype maps to the list
 * of server catalog entries scoped to it.
 */
export const ARCHETYPE_MCP_SERVERS: Record<ArchetypeSlug, ServerCatalogEntry[]> = {
  executive_assistant: listServersForArchetypeEager("executive_assistant"),
  events_director: listServersForArchetypeEager("events_director"),
  development_director: listServersForArchetypeEager("development_director"),
  marketing_director: listServersForArchetypeEager("marketing_director"),
  programs_director: listServersForArchetypeEager("programs_director"),
  hr_volunteer_coordinator: listServersForArchetypeEager("hr_volunteer_coordinator"),
};

/**
 * Eager variant of listServersForArchetype that does NOT skip env-gated entries —
 * used only for the static export above so admin tooling sees the full catalog
 * (even Canva when CANVA_MCP_URL isn't set, so it can show "configured but
 * URL pending"). Runtime resolution still uses listServersForArchetype().
 */
function listServersForArchetypeEager(archetype: ArchetypeSlug): ServerCatalogEntry[] {
  return Object.values(SERVER_CATALOG).filter((entry) => entry.archetypes.includes(archetype));
}
