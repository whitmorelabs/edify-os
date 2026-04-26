/**
 * Canva OAuth helpers — token refresh + validation for per-org mcp_connections rows.
 *
 * Canva OAuth 2.0 endpoints (confirmed from Canva Connect OpenAPI spec):
 *   Token URL:    https://api.canva.com/rest/v1/oauth/token
 *   Revoke URL:   https://api.canva.com/rest/v1/oauth/revoke
 *   Authorize URL: https://www.canva.com/api/oauth/authorize
 *
 * Canva uses Authorization Code + PKCE (code_challenge_method=S256).
 * Refresh tokens are single-use — each refresh issues a new refresh token.
 * Token exchange and refresh use HTTP Basic auth (Base64 client_id:client_secret).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { encrypt, decryptIfEncrypted } from "@/lib/crypto";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const CANVA_TOKEN_URL = "https://api.canva.com/rest/v1/oauth/token";
export const CANVA_REVOKE_URL = "https://api.canva.com/rest/v1/oauth/revoke";
export const CANVA_AUTHORIZE_URL = "https://www.canva.com/api/oauth/authorize";

/**
 * Scopes required for Marketing Director to create and read Canva designs.
 * Canva scopes are NOT cumulative — each must be listed explicitly.
 */
export const CANVA_SCOPES = [
  "design:content:read",
  "design:content:write",
  "asset:read",
  "asset:write",
  "profile:read",
].join(" ");

/** Cookie name for CSRF state token — shared by connect + callback routes. */
export const CANVA_STATE_COOKIE = "canva_oauth_state";

/** server_name stored in the mcp_connections table for Canva. */
export const CANVA_SERVER_NAME = "canva";

/**
 * Crypto label constants — passed to decryptIfEncrypted for legacy-warn logging.
 * Keep in sync with CRYPTO_LABEL_* constants in lib/crypto.ts.
 */
export const CRYPTO_LABEL_CANVA_ACCESS_TOKEN = "mcp_connections.canva.access_token";
export const CRYPTO_LABEL_CANVA_REFRESH_TOKEN = "mcp_connections.canva.refresh_token";

// ---------------------------------------------------------------------------
// Basic auth helper (Canva requires client_id:client_secret as HTTP Basic)
// ---------------------------------------------------------------------------

function buildBasicAuth(clientId: string, clientSecret: string): string {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

// ---------------------------------------------------------------------------
// Token refresh
// ---------------------------------------------------------------------------

/**
 * Refresh a Canva access token using the stored refresh token.
 *
 * Canva single-use refresh tokens: each successful refresh issues a NEW refresh
 * token. We must store the new one immediately or lose the ability to refresh again.
 *
 * @param serviceClient  Supabase service-role client (bypasses RLS)
 * @param orgId          The org whose mcp_connections row to update
 * @param refreshToken   DECRYPTED plaintext refresh token (not the raw DB value)
 * @returns { accessToken } on success, { error: string } on failure
 */
export async function refreshCanvaToken(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: SupabaseClient<any>,
  orgId: string,
  refreshToken: string
): Promise<{ accessToken: string } | { error: string }> {
  const clientId = process.env.CANVA_OAUTH_CLIENT_ID;
  const clientSecret = process.env.CANVA_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return { error: "Canva OAuth credentials not configured on server" };
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  let tokenData: {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  try {
    const res = await fetch(CANVA_TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: buildBasicAuth(clientId, clientSecret),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    tokenData = (await res.json()) as typeof tokenData;

    if (!res.ok || !tokenData.access_token) {
      console.error("[canva-oauth] Refresh failed:", tokenData);
      return {
        error:
          tokenData.error_description ??
          tokenData.error ??
          "Canva token refresh failed. Please reconnect Canva.",
      };
    }
  } catch (err) {
    console.error("[canva-oauth] Refresh request threw:", err);
    return { error: "Canva token refresh request failed. Please reconnect Canva." };
  }

  const newAccessToken = tokenData.access_token;
  const newRefreshToken = tokenData.refresh_token; // Canva rotates refresh tokens
  const expiresAt = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    : null;

  // Update the mcp_connections row with the new encrypted tokens
  const updatePayload: Record<string, unknown> = {
    access_token: encrypt(newAccessToken),
    updated_at: new Date().toISOString(),
  };
  if (newRefreshToken) {
    updatePayload.refresh_token = encrypt(newRefreshToken);
  }
  if (expiresAt) {
    updatePayload.expires_at = expiresAt;
  }

  const { error: dbErr } = await serviceClient
    .from("mcp_connections")
    .update(updatePayload)
    .eq("org_id", orgId)
    .eq("server_name", CANVA_SERVER_NAME);

  if (dbErr) {
    // Non-fatal — return the new access token even if we couldn't persist it.
    // Next request will re-refresh, which is fine.
    console.error("[canva-oauth] Failed to persist refreshed token:", dbErr);
  }

  return { accessToken: newAccessToken };
}

// ---------------------------------------------------------------------------
// Token revocation
// ---------------------------------------------------------------------------

/**
 * Revoke a Canva access token or refresh token at Canva's revocation endpoint.
 * Best-effort — we do not fail the disconnect flow if this call fails.
 *
 * @param token        DECRYPTED plaintext token to revoke
 * @param tokenType    "access_token" | "refresh_token"
 */
export async function revokeCanvaToken(
  token: string,
  tokenType: "access_token" | "refresh_token" = "access_token"
): Promise<void> {
  const clientId = process.env.CANVA_OAUTH_CLIENT_ID;
  const clientSecret = process.env.CANVA_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret || !token) return;

  try {
    const body = new URLSearchParams({ token, token_type_hint: tokenType });
    const res = await fetch(CANVA_REVOKE_URL, {
      method: "POST",
      headers: {
        Authorization: buildBasicAuth(clientId, clientSecret),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "(no body)");
      console.warn(`[canva-oauth] Revoke returned ${res.status}:`, text);
    }
  } catch (err) {
    // Best-effort — log but do not propagate
    console.warn("[canva-oauth] Revoke request threw:", err);
  }
}

// ---------------------------------------------------------------------------
// Valid access token lookup (with auto-refresh)
// ---------------------------------------------------------------------------

/**
 * Returns a valid Canva access token for the given org.
 * Reads the mcp_connections row, refreshes if within 60s of expiry, persists new tokens.
 *
 * Returns { accessToken: string } or { error: string } — callers pattern-match on 'error'.
 * Returns { notConnected: true } when no Canva connection exists for the org (graceful skip).
 */
export async function getValidCanvaAccessToken(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: SupabaseClient<any>,
  orgId: string
): Promise<{ accessToken: string } | { error: string } | { notConnected: true }> {
  const { data: row, error: dbError } = await serviceClient
    .from("mcp_connections")
    .select("access_token, refresh_token, expires_at")
    .eq("org_id", orgId)
    .eq("server_name", CANVA_SERVER_NAME)
    .maybeSingle();

  if (dbError) {
    console.error("[canva-oauth] DB lookup error:", dbError);
    return { error: "Database error looking up Canva connection." };
  }

  if (!row) {
    return { notConnected: true };
  }

  const rawAccessToken = row.access_token as string | null;
  const rawRefreshToken = row.refresh_token as string | null;
  const expiresAt = row.expires_at as string | null;

  if (!rawAccessToken) {
    return { error: "Canva connection has no access token." };
  }

  // Decrypt — decryptIfEncrypted handles legacy plaintext gracefully
  let accessToken: string | null;
  let refreshToken: string | null;
  try {
    accessToken = decryptIfEncrypted(rawAccessToken, CRYPTO_LABEL_CANVA_ACCESS_TOKEN);
  } catch (err) {
    console.error("[canva-oauth] Failed to decrypt access token:", err);
    return { error: "Could not access stored Canva credentials. Please reconnect Canva." };
  }
  try {
    refreshToken = decryptIfEncrypted(rawRefreshToken, CRYPTO_LABEL_CANVA_REFRESH_TOKEN);
  } catch (err) {
    console.error("[canva-oauth] Failed to decrypt refresh token:", err);
    return { error: "Could not access stored Canva credentials. Please reconnect Canva." };
  }

  if (!accessToken) {
    return { error: "Canva connection has no access token after decryption." };
  }

  // Check if token is still valid (with 60s buffer)
  if (expiresAt) {
    const expiresMs = new Date(expiresAt).getTime();
    if (expiresMs - Date.now() > 60_000) {
      return { accessToken };
    }
  }

  // Token expired (or no expiry stored) — refresh
  if (!refreshToken) {
    return {
      error:
        "Canva token expired and no refresh token available. Please reconnect Canva in Settings → Integrations.",
    };
  }

  return refreshCanvaToken(serviceClient, orgId, refreshToken);
}
