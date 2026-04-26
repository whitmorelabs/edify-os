/**
 * GET /api/integrations/canva/callback
 *
 * Canva OAuth 2.0 callback handler.
 *
 * Flow:
 *   1. Validate CSRF state token from cookie
 *   2. Exchange authorization code + PKCE code_verifier for tokens
 *   3. Fetch Canva user profile (email) for display in the UI
 *   4. Upsert row into mcp_connections (server_name = 'canva')
 *      Tokens are encrypted at rest using AES-256-GCM via lib/crypto.ts
 *   5. Redirect to /dashboard/integrations?canva=connected
 *
 * Tokens are encrypted using the ENCRYPTION_KEY env var (AES-256-GCM).
 * If ENCRYPTION_KEY is not set, the encrypt() call throws — the server
 * will return an error rather than storing plaintext tokens.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthContext, createServiceRoleClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/crypto";
import {
  CANVA_TOKEN_URL,
  CANVA_STATE_COOKIE,
  CANVA_SERVER_NAME,
} from "@/lib/mcp/canva-oauth";
import { getAppOrigin } from "@/lib/google";

const CANVA_PKCE_COOKIE = "canva_oauth_pkce";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  const origin = getAppOrigin();

  async function clearCookiesAndRedirect(target: string): Promise<NextResponse> {
    const cookieStore = await cookies();
    cookieStore.delete(CANVA_STATE_COOKIE);
    cookieStore.delete(CANVA_PKCE_COOKIE);
    return NextResponse.redirect(target);
  }

  // --- User denied access ---
  if (errorParam) {
    return clearCookiesAndRedirect(
      `${origin}/dashboard/integrations?canva=denied&reason=${encodeURIComponent(errorParam)}`
    );
  }

  // --- CSRF state validation ---
  const cookieStore = await cookies();
  const storedState = cookieStore.get(CANVA_STATE_COOKIE)?.value;
  const codeVerifier = cookieStore.get(CANVA_PKCE_COOKIE)?.value;

  if (!storedState || storedState !== state) {
    return NextResponse.json(
      { error: "OAuth state mismatch (possible CSRF attempt)" },
      { status: 400 }
    );
  }

  if (!code) {
    return clearCookiesAndRedirect(
      `${origin}/dashboard/integrations?canva=denied&reason=no_code`
    );
  }

  if (!codeVerifier) {
    return clearCookiesAndRedirect(
      `${origin}/dashboard/integrations?canva=denied&reason=pkce_missing`
    );
  }

  // --- Auth gate ---
  const { user, orgId, memberId } = await getAuthContext();
  if (!user || !orgId || !memberId) {
    return clearCookiesAndRedirect(
      `${origin}/dashboard/integrations?canva=denied&reason=unauthorized`
    );
  }

  const clientId = process.env.CANVA_OAUTH_CLIENT_ID;
  const clientSecret = process.env.CANVA_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return clearCookiesAndRedirect(
      `${origin}/dashboard/integrations?canva=denied&reason=server_config_error`
    );
  }

  const redirectUri =
    process.env.CANVA_OAUTH_REDIRECT_URI ??
    `${origin}/api/integrations/canva/callback`;

  // --- Exchange code for tokens (Authorization Code + PKCE) ---
  const basicAuth = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;

  let tokenData: {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  try {
    const tokenBody = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    });

    const tokenRes = await fetch(CANVA_TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: basicAuth,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenBody.toString(),
    });

    tokenData = (await tokenRes.json()) as typeof tokenData;

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("[canva/callback] Token exchange failed:", tokenData);
      const reason = encodeURIComponent(
        tokenData.error_description ?? tokenData.error ?? "token_exchange_failed"
      );
      return clearCookiesAndRedirect(
        `${origin}/dashboard/integrations?canva=denied&reason=${reason}`
      );
    }
  } catch (err) {
    console.error("[canva/callback] Token exchange threw:", err);
    return clearCookiesAndRedirect(
      `${origin}/dashboard/integrations?canva=denied&reason=token_exchange_failed`
    );
  }

  const { access_token, refresh_token, expires_in } = tokenData;

  // --- Fetch Canva user profile (email for UI display) ---
  let canvaEmail: string | null = null;
  try {
    const profileRes = await fetch(
      "https://api.canva.com/rest/v1/users/me/profile",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );
    if (profileRes.ok) {
      const profile = (await profileRes.json()) as {
        profile?: { email?: string; display_name?: string };
      };
      canvaEmail = profile?.profile?.email ?? null;
    }
  } catch {
    // Non-fatal — we can store the connection without the email
  }

  // --- Compute expiry ---
  const expiresAt = expires_in
    ? new Date(Date.now() + expires_in * 1000).toISOString()
    : null;

  // --- Upsert mcp_connections row ---
  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return clearCookiesAndRedirect(
      `${origin}/dashboard/integrations?canva=denied&reason=db_unavailable`
    );
  }

  const upsertRow: Record<string, unknown> = {
    org_id: orgId,
    server_name: CANVA_SERVER_NAME,
    access_token: encrypt(access_token!),
    metadata: { canva_email: canvaEmail },
    updated_at: new Date().toISOString(),
  };
  if (refresh_token) {
    upsertRow.refresh_token = encrypt(refresh_token);
  }
  if (expiresAt) {
    upsertRow.expires_at = expiresAt;
  }

  const { error: upsertError } = await serviceClient
    .from("mcp_connections")
    .upsert(upsertRow, { onConflict: "org_id,server_name" });

  if (upsertError) {
    console.error("[canva/callback] Failed to upsert mcp_connections:", upsertError);
    return clearCookiesAndRedirect(
      `${origin}/dashboard/integrations?canva=denied&reason=db_error`
    );
  }

  return clearCookiesAndRedirect(`${origin}/dashboard/integrations?canva=connected`);
}
