/**
 * GET /api/admin/mcp-status
 *
 * Diagnostic endpoint shipped with MCP-0 Sprint 1. Returns, for the
 * authenticated org, the list of MCP servers in the catalog along with:
 *   - which archetypes the server is in scope for
 *   - this org's connection state (connected | not_connected | error)
 *   - relevant non-secret metadata (workspace name, email, etc) when connected
 *
 * NEVER returns access/refresh tokens. NEVER logs them. The Anthropic
 * `mcp_servers` payload is strictly assembled in buildMcpServersForOrg() at
 * chat time; this endpoint is read-only and hits the same DB rows.
 *
 * Auth: any authenticated user in a valid org. Mirrors /api/admin/canva-test
 * pattern (no admin-role gating because only Citlali / test orgs hit this).
 */

import { NextResponse } from "next/server";
import { getAuthContext, createServiceRoleClient } from "@/lib/supabase/server";
import { SERVER_CATALOG } from "@/lib/mcp/server-catalog";
import { getValidAccessToken } from "@/lib/mcp/oauth-factory";

export async function GET() {
  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "database not configured" }, { status: 503 });
  }

  // Hydrate per-server status. Done sequentially because the call count is small (3-ish today).
  const servers = await Promise.all(
    Object.values(SERVER_CATALOG).map(async (entry) => {
      const base = {
        id: entry.id,
        displayName: entry.displayName,
        url: entry.url,
        url_configured: Boolean(entry.url),
        url_env_gate: entry.urlEnvGate ?? null,
        auth_mode: entry.authMode,
        archetypes: entry.archetypes,
      };

      if (entry.authMode === "anonymous") {
        return { ...base, status: "ready" as const };
      }

      if (entry.authMode === "bearer-env") {
        const tokenPresent = Boolean(entry.bearerEnv && process.env[entry.bearerEnv]);
        return {
          ...base,
          status: tokenPresent ? ("ready" as const) : ("missing_env_token" as const),
          bearer_env: entry.bearerEnv,
        };
      }

      // OAuth — check the org's connection state without surfacing tokens
      const { data: row, error } = await serviceClient
        .from("mcp_connections")
        .select("expires_at, metadata")
        .eq("org_id", orgId)
        .eq("server_name", entry.id)
        .maybeSingle();

      if (error) {
        return { ...base, status: "db_error" as const, error: error.message };
      }
      if (!row) {
        return { ...base, status: "not_connected" as const };
      }

      // Best-effort token refresh probe — surfaces any "needs reconnect" issues
      // without leaking the token itself. We only inspect the result discriminator.
      const tokenResult = await getValidAccessToken(serviceClient, orgId, entry.id);
      let tokenStatus: "valid" | "needs_reconnect" | "not_connected";
      if ("accessToken" in tokenResult) tokenStatus = "valid";
      else if ("notConnected" in tokenResult) tokenStatus = "not_connected";
      else tokenStatus = "needs_reconnect";

      return {
        ...base,
        status: "connected" as const,
        token_status: tokenStatus,
        expires_at: row.expires_at,
        metadata: row.metadata,
      };
    }),
  );

  return NextResponse.json({ org_id: orgId, servers });
}
