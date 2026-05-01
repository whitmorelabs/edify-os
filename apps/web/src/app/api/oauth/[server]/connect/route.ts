/**
 * GET /api/oauth/[server]/connect
 *
 * Generic OAuth start endpoint for any MCP server registered in the catalog
 * with `authMode === "oauth"`. Builds the authorize URL from `server-catalog.ts`,
 * stores CSRF state (and a PKCE code_verifier when the server requires PKCE)
 * in short-lived httpOnly cookies, then redirects the user to the provider's
 * consent screen.
 *
 * Servers covered today:
 *   - notion (no PKCE, owner=user query param)
 *
 * Canva has its own legacy route at /api/integrations/canva/connect (kept
 * intact for MCP-0 Sprint 1 to avoid risking the production Canva flow).
 *
 * Sprint 2 (per PRD): a connector tile UI in /dashboard/integrations will
 * link to this route. Per memory feedback_edify_no_visual_changes, the UI is
 * Z+Milo's surface; we add the route only.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes, createHash } from "crypto";
import { getAuthContext } from "@/lib/supabase/server";
import { getServerEntry } from "@/lib/mcp/server-catalog";
import { buildRedirectUri } from "@/lib/mcp/oauth-factory";
import { getAppOrigin } from "@/lib/google";

/** Cookie names — namespaced by server id so two simultaneous flows don't collide. */
function stateCookieName(serverId: string): string {
  return `mcp_oauth_${serverId}_state`;
}
function pkceCookieName(serverId: string): string {
  return `mcp_oauth_${serverId}_pkce`;
}

/** URL-safe Base64 (no padding, +→-, /→_). */
function base64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export async function GET(
  _req: NextRequest,
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
  const oauth = entry.oauth;

  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env[oauth.clientIdEnv];
  if (!clientId) {
    return NextResponse.json(
      {
        error: `${entry.displayName} OAuth is not configured on this server. Set ${oauth.clientIdEnv}.`,
      },
      { status: 500 },
    );
  }

  const redirectUri = buildRedirectUri(entry, getAppOrigin());

  // CSRF state token
  const state = randomBytes(32).toString("hex");

  // PKCE code_verifier — only generated when the server requires PKCE (Canva does, Notion doesn't)
  let codeVerifier: string | null = null;
  let codeChallenge: string | null = null;
  if (oauth.usePkce) {
    codeVerifier = base64url(randomBytes(48));
    codeChallenge = base64url(createHash("sha256").update(codeVerifier, "ascii").digest());
  }

  // Build authorize URL
  const authParams = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    ...(oauth.scopes ? { scope: oauth.scopes } : {}),
    ...(oauth.usePkce && codeChallenge
      ? { code_challenge: codeChallenge, code_challenge_method: "S256" }
      : {}),
    ...(oauth.authorizeExtraParams ?? {}),
  });

  const authorizeUrl = `${oauth.authorizeUrl}?${authParams.toString()}`;

  // Persist state + (optional) PKCE verifier in short-lived httpOnly cookies
  const cookieStore = await cookies();
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 10 * 60, // 10 minutes — matches existing Canva pattern
    path: "/",
  };
  cookieStore.set(stateCookieName(serverId), state, cookieOpts);
  if (codeVerifier) {
    cookieStore.set(pkceCookieName(serverId), codeVerifier, cookieOpts);
  }

  return NextResponse.redirect(authorizeUrl);
}
