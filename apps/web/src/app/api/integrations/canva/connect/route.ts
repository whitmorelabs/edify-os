/**
 * GET /api/integrations/canva/connect
 *
 * Initiates the Canva OAuth 2.0 Authorization Code + PKCE flow.
 * Builds the Canva authorize URL, stores a CSRF state token in a short-lived
 * httpOnly cookie, and redirects the user to Canva's consent screen.
 *
 * Canva PKCE requirement:
 *   - Generate a cryptographically random code_verifier (43–128 chars, URL-safe)
 *   - Compute code_challenge = BASE64URL(SHA256(ASCII(code_verifier)))
 *   - code_challenge_method = "S256"
 *   - Store code_verifier in a cookie so the callback can exchange it
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes, createHash } from "crypto";
import { getAuthContext } from "@/lib/supabase/server";
import {
  CANVA_AUTHORIZE_URL,
  CANVA_SCOPES,
  CANVA_STATE_COOKIE,
} from "@/lib/mcp/canva-oauth";
import { getAppOrigin } from "@/lib/google";

/** Cookie name for the PKCE code_verifier (separate from state cookie). */
const CANVA_PKCE_COOKIE = "canva_oauth_pkce";

/**
 * Build a URL-safe Base64 string (no padding, +→-, /→_).
 */
function base64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export async function GET() {
  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.CANVA_OAUTH_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "Canva OAuth is not configured on this server. Set CANVA_OAUTH_CLIENT_ID." },
      { status: 500 }
    );
  }

  // Pin redirect_uri from env — never derive from request headers (open-redirect risk)
  const redirectUri =
    process.env.CANVA_OAUTH_REDIRECT_URI ??
    `${getAppOrigin()}/api/integrations/canva/callback`;

  // CSRF state token
  const state = randomBytes(32).toString("hex");

  // PKCE code_verifier (43 random URL-safe bytes → 64 hex chars is fine)
  const codeVerifier = base64url(randomBytes(48));

  // code_challenge = BASE64URL(SHA256(ASCII(code_verifier)))
  const codeChallenge = base64url(
    createHash("sha256").update(codeVerifier, "ascii").digest()
  );

  // Build the authorize URL
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: CANVA_SCOPES,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  const authorizeUrl = `${CANVA_AUTHORIZE_URL}?${params.toString()}`;

  // Store state + code_verifier in short-lived httpOnly cookies for CSRF + PKCE
  const cookieStore = await cookies();
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 10 * 60, // 10 minutes
    path: "/",
  };

  cookieStore.set(CANVA_STATE_COOKIE, state, cookieOpts);
  cookieStore.set(CANVA_PKCE_COOKIE, codeVerifier, cookieOpts);

  return NextResponse.redirect(authorizeUrl);
}
