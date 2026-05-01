/**
 * GET /api/oauth/[server]/callback
 *
 * Generic OAuth callback for any MCP server registered in server-catalog.ts
 * with `authMode === "oauth"`. Validates CSRF state, exchanges the code for
 * tokens via the factory's exchangeCodeForTokens(), upserts an encrypted row
 * into mcp_connections, and redirects back to the integrations page with a
 * status flash param.
 *
 * Flash param shape (consistent with existing Canva flow):
 *   /dashboard/integrations?<server>=connected
 *   /dashboard/integrations?<server>=denied&reason=<encoded_reason>
 *
 * Token storage:
 *   - access_token, refresh_token: encrypted via lib/crypto.ts (AES-256-GCM)
 *   - expires_at: ISO timestamp computed from expires_in
 *   - metadata: per-server fields harvested by oauth.metadataFromTokenResponse
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthContext, createServiceRoleClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/crypto";
import { getServerEntry } from "@/lib/mcp/server-catalog";
import { buildRedirectUri, exchangeCodeForTokens } from "@/lib/mcp/oauth-factory";
import { getAppOrigin } from "@/lib/google";

function stateCookieName(serverId: string): string {
  return `mcp_oauth_${serverId}_state`;
}
function pkceCookieName(serverId: string): string {
  return `mcp_oauth_${serverId}_pkce`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ server: string }> },
) {
  const { server: serverId } = await params;

  const entry = getServerEntry(serverId);
  if (!entry || entry.authMode !== "oauth" || !entry.oauth) {
    return NextResponse.json(
      { error: `Unknown OAuth server: ${serverId}` },
      { status: 404 },
    );
  }

  const origin = getAppOrigin();
  const integrationsRedirect = (status: "connected" | "denied", reason?: string) => {
    const qp = new URLSearchParams({ [serverId]: status });
    if (reason) qp.set("reason", reason);
    return `${origin}/dashboard/integrations?${qp.toString()}`;
  };

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  // Helper to clear cookies before redirecting (whether success or failure)
  async function clearCookiesAndRedirect(target: string): Promise<NextResponse> {
    const cookieStore = await cookies();
    cookieStore.delete(stateCookieName(serverId));
    cookieStore.delete(pkceCookieName(serverId));
    return NextResponse.redirect(target);
  }

  // --- User denied ---
  if (errorParam) {
    return clearCookiesAndRedirect(
      integrationsRedirect("denied", encodeURIComponent(errorParam)),
    );
  }

  // --- CSRF state validation ---
  const cookieStore = await cookies();
  const storedState = cookieStore.get(stateCookieName(serverId))?.value;
  const codeVerifier = cookieStore.get(pkceCookieName(serverId))?.value;

  if (!storedState || storedState !== state) {
    return NextResponse.json(
      { error: "OAuth state mismatch (possible CSRF attempt)" },
      { status: 400 },
    );
  }
  if (!code) {
    return clearCookiesAndRedirect(integrationsRedirect("denied", "no_code"));
  }
  if (entry.oauth.usePkce && !codeVerifier) {
    return clearCookiesAndRedirect(integrationsRedirect("denied", "pkce_missing"));
  }

  // --- Auth gate ---
  const { user, orgId, memberId } = await getAuthContext();
  if (!user || !orgId || !memberId) {
    return clearCookiesAndRedirect(integrationsRedirect("denied", "unauthorized"));
  }

  // --- Exchange code for tokens (factory does the per-server quirks) ---
  const redirectUri = buildRedirectUri(entry, origin);
  const result = await exchangeCodeForTokens(serverId, {
    code,
    redirectUri,
    codeVerifier,
  });

  if ("error" in result) {
    return clearCookiesAndRedirect(
      integrationsRedirect("denied", encodeURIComponent(result.error)),
    );
  }

  // --- Upsert mcp_connections row ---
  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return clearCookiesAndRedirect(integrationsRedirect("denied", "db_unavailable"));
  }

  const upsertRow: Record<string, unknown> = {
    org_id: orgId,
    server_name: serverId,
    access_token: encrypt(result.accessToken),
    metadata: result.metadata ?? {},
    updated_at: new Date().toISOString(),
  };
  if (result.refreshToken) {
    upsertRow.refresh_token = encrypt(result.refreshToken);
  }
  if (result.expiresAt) {
    upsertRow.expires_at = result.expiresAt;
  }

  const { error: upsertError } = await serviceClient
    .from("mcp_connections")
    .upsert(upsertRow, { onConflict: "org_id,server_name" });

  if (upsertError) {
    console.error(`[/api/oauth/${serverId}/callback] mcp_connections upsert failed:`, upsertError);
    return clearCookiesAndRedirect(integrationsRedirect("denied", "db_error"));
  }

  return clearCookiesAndRedirect(integrationsRedirect("connected"));
}
