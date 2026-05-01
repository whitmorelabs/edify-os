/**
 * Generic OAuth helpers for MCP servers. Sprint 1 of MCP-0 generalizes the
 * Canva-specific code in canva-oauth.ts into a config-driven factory keyed
 * off ServerCatalogEntry.oauth.
 *
 * Behavior preserved from canva-oauth.ts (so Canva keeps working):
 *   - 60-second pre-expiry refresh buffer
 *   - Single-use refresh tokens persist immediately on success
 *   - Encryption via lib/crypto.encrypt / decryptIfEncrypted
 *   - Graceful "notConnected" return when the org has no row
 *   - Best-effort revoke on disconnect (logs but never throws)
 *
 * What's new (general):
 *   - clientAuth: "basic" | "post" — Notion + Canva use Basic; future POST-style servers supported
 *   - usePkce: boolean — Canva uses PKCE; Notion doesn't
 *   - refreshTokenRotates: boolean — both Canva and Notion rotate, but explicit flag future-proofs
 *   - metadataFromTokenResponse: optional hook to extract per-server metadata for storage
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { encrypt, decryptIfEncrypted } from "@/lib/crypto";
import {
  type ServerCatalogEntry,
  type OAuthConfig,
  getServerEntry,
} from "@/lib/mcp/server-catalog";

// ---------------------------------------------------------------------------
// Result types — pattern-match on key (matches existing canva-oauth.ts shape)
// ---------------------------------------------------------------------------

export type AccessTokenResult =
  | { accessToken: string }
  | { error: string }
  | { notConnected: true };

export type RefreshResult = { accessToken: string } | { error: string };

// ---------------------------------------------------------------------------
// Crypto label helpers — used to attribute legacy-warn logs in lib/crypto.ts
// to a specific server. The label format mirrors canva-oauth.ts so existing
// Canva log lines stay stable when Canva flows through the factory.
// ---------------------------------------------------------------------------

function accessTokenLabel(serverId: string): string {
  return `mcp_connections.${serverId}.access_token`;
}

function refreshTokenLabel(serverId: string): string {
  return `mcp_connections.${serverId}.refresh_token`;
}

// ---------------------------------------------------------------------------
// Client credential header builder
// ---------------------------------------------------------------------------

function basicAuthHeader(clientId: string, clientSecret: string): string {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

/**
 * Resolve the OAuth client credentials and the auth-header / form-body strategy
 * for a given server. Returns null if env vars are missing — caller surfaces
 * an actionable error.
 */
function resolveCredentials(
  oauth: OAuthConfig,
): { clientId: string; clientSecret: string } | null {
  const clientId = process.env[oauth.clientIdEnv];
  const clientSecret = process.env[oauth.clientSecretEnv];
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

/**
 * Apply the catalog's clientAuth strategy: either set HTTP Basic on the headers,
 * or inject client_id + client_secret into the form body. Mutates both args
 * in place so the caller's existing references stay correct.
 */
function applyClientAuth(
  oauth: OAuthConfig,
  creds: { clientId: string; clientSecret: string },
  headers: Record<string, string>,
  body: URLSearchParams,
): void {
  if (oauth.clientAuth === "basic") {
    headers.Authorization = basicAuthHeader(creds.clientId, creds.clientSecret);
  } else {
    body.set("client_id", creds.clientId);
    body.set("client_secret", creds.clientSecret);
  }
}

/**
 * Build the redirect URI for a server. Servers may pin a custom path via
 * `legacyRedirectPath` (Canva uses /api/integrations/canva/callback so it
 * doesn't break PR #19's existing OAuth wiring); new servers default to the
 * generic /api/oauth/[server]/callback handler shipped in MCP-0 Sprint 1.
 */
export function buildRedirectUri(entry: ServerCatalogEntry, origin: string): string {
  const oauth = entry.oauth;
  if (!oauth) return "";
  const fromEnv = oauth.redirectUriEnv ? process.env[oauth.redirectUriEnv] : undefined;
  if (fromEnv) return fromEnv;
  if (oauth.legacyRedirectPath) return `${origin}${oauth.legacyRedirectPath}`;
  return `${origin}/api/oauth/${entry.id}/callback`;
}

// ---------------------------------------------------------------------------
// Token refresh
// ---------------------------------------------------------------------------

/**
 * Refresh an access token for the given server + org using the stored refresh token.
 * Persists the new tokens immediately so single-use refresh tokens (Canva, Notion)
 * don't get lost if a subsequent request fires before persistence completes.
 *
 * @param serviceClient  Supabase service-role client (bypasses RLS)
 * @param orgId          Org whose mcp_connections row to update
 * @param serverId       Server catalog id (also the mcp_connections.server_name)
 * @param refreshToken   DECRYPTED plaintext refresh token (NOT the raw DB value)
 */
export async function refreshAccessToken(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: SupabaseClient<any>,
  orgId: string,
  serverId: string,
  refreshToken: string,
): Promise<RefreshResult> {
  const entry = getServerEntry(serverId);
  if (!entry || !entry.oauth) {
    return { error: `Unknown OAuth server "${serverId}"` };
  }
  const oauth = entry.oauth;

  const creds = resolveCredentials(oauth);
  if (!creds) {
    return { error: `${entry.displayName} OAuth credentials not configured on server` };
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  applyClientAuth(oauth, creds, headers, body);

  let tokenData: {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  try {
    const res = await fetch(oauth.tokenUrl, {
      method: "POST",
      headers,
      body: body.toString(),
    });
    tokenData = (await res.json()) as typeof tokenData;
    if (!res.ok || !tokenData.access_token) {
      console.error(`[mcp-oauth ${serverId}] Refresh failed:`, tokenData);
      return {
        error:
          tokenData.error_description ??
          tokenData.error ??
          `${entry.displayName} token refresh failed. Please reconnect ${entry.displayName}.`,
      };
    }
  } catch (err) {
    console.error(`[mcp-oauth ${serverId}] Refresh request threw:`, err);
    return {
      error: `${entry.displayName} token refresh request failed. Please reconnect ${entry.displayName}.`,
    };
  }

  const newAccessToken = tokenData.access_token;
  const newRefreshToken = tokenData.refresh_token;
  const expiresAt = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    : null;

  // Persist new tokens. Non-fatal on failure — caller still gets the new
  // access token; next request will simply re-refresh.
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
    .eq("server_name", serverId);

  if (dbErr) {
    console.error(`[mcp-oauth ${serverId}] Failed to persist refreshed token:`, dbErr);
  }

  return { accessToken: newAccessToken };
}

// ---------------------------------------------------------------------------
// Token revocation (best-effort)
// ---------------------------------------------------------------------------

/**
 * Revoke a token at the server's revocation endpoint. Called from disconnect
 * routes — best-effort: log on failure but never throw.
 */
export async function revokeAccessToken(
  serverId: string,
  token: string,
  tokenType: "access_token" | "refresh_token" = "access_token",
): Promise<void> {
  const entry = getServerEntry(serverId);
  if (!entry || !entry.oauth || !entry.oauth.revokeUrl || !token) return;
  const oauth = entry.oauth;
  // TS narrowing was lost across the reassignment above; the check on line
  // entry.oauth.revokeUrl guarantees this is non-null.
  const revokeUrl: string = oauth.revokeUrl as string;

  const creds = resolveCredentials(oauth);
  if (!creds) return;

  const body = new URLSearchParams({ token, token_type_hint: tokenType });
  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  applyClientAuth(oauth, creds, headers, body);

  try {
    const res = await fetch(revokeUrl, {
      method: "POST",
      headers,
      body: body.toString(),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "(no body)");
      console.warn(`[mcp-oauth ${serverId}] Revoke returned ${res.status}:`, text);
    }
  } catch (err) {
    console.warn(`[mcp-oauth ${serverId}] Revoke request threw:`, err);
  }
}

// ---------------------------------------------------------------------------
// Valid access token lookup (with auto-refresh)
// ---------------------------------------------------------------------------

/**
 * Returns a valid access token for the given org + server. Reads mcp_connections,
 * decrypts, and refreshes if the token is within 60s of expiry.
 *
 * Mirrors canva-oauth.ts's getValidCanvaAccessToken contract verbatim so
 * callers can pattern-match on `notConnected | error | accessToken`.
 */
export async function getValidAccessToken(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: SupabaseClient<any>,
  orgId: string,
  serverId: string,
): Promise<AccessTokenResult> {
  const entry = getServerEntry(serverId);
  if (!entry) {
    return { error: `Unknown MCP server "${serverId}"` };
  }
  if (entry.authMode !== "oauth") {
    return { error: `Server "${serverId}" is not OAuth-authenticated` };
  }

  const { data: row, error: dbError } = await serviceClient
    .from("mcp_connections")
    .select("access_token, refresh_token, expires_at")
    .eq("org_id", orgId)
    .eq("server_name", serverId)
    .maybeSingle();

  if (dbError) {
    console.error(`[mcp-oauth ${serverId}] DB lookup error:`, dbError);
    return { error: `Database error looking up ${entry.displayName} connection.` };
  }

  if (!row) {
    return { notConnected: true };
  }

  const rawAccessToken = row.access_token as string | null;
  const rawRefreshToken = row.refresh_token as string | null;
  const expiresAt = row.expires_at as string | null;

  if (!rawAccessToken) {
    return { error: `${entry.displayName} connection has no access token.` };
  }

  let accessToken: string | null;
  let refreshToken: string | null;
  try {
    accessToken = decryptIfEncrypted(rawAccessToken, accessTokenLabel(serverId));
  } catch (err) {
    console.error(`[mcp-oauth ${serverId}] Failed to decrypt access token:`, err);
    return {
      error: `Could not access stored ${entry.displayName} credentials. Please reconnect ${entry.displayName}.`,
    };
  }
  try {
    refreshToken = decryptIfEncrypted(rawRefreshToken, refreshTokenLabel(serverId));
  } catch (err) {
    console.error(`[mcp-oauth ${serverId}] Failed to decrypt refresh token:`, err);
    return {
      error: `Could not access stored ${entry.displayName} credentials. Please reconnect ${entry.displayName}.`,
    };
  }

  if (!accessToken) {
    return { error: `${entry.displayName} connection has no access token after decryption.` };
  }

  // 60s pre-expiry buffer matches the historical Canva behavior.
  if (expiresAt) {
    const expiresMs = new Date(expiresAt).getTime();
    if (expiresMs - Date.now() > 60_000) {
      return { accessToken };
    }
  }

  if (!refreshToken) {
    return {
      error: `${entry.displayName} token expired and no refresh token available. Please reconnect ${entry.displayName} in Settings → Integrations.`,
    };
  }

  return refreshAccessToken(serviceClient, orgId, serverId, refreshToken);
}

// ---------------------------------------------------------------------------
// Authorization-code exchange (used by /api/oauth/[server]/callback)
// ---------------------------------------------------------------------------

export interface CodeExchangeResult {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  /** Per-server metadata harvested from the token-endpoint response. */
  metadata: Record<string, unknown> | null;
}

/**
 * Exchange an authorization code for tokens. Used by the generic
 * /api/oauth/[server]/callback route. Returns either the parsed tokens or an
 * error string the caller can surface in the redirect query.
 */
export async function exchangeCodeForTokens(
  serverId: string,
  args: {
    code: string;
    redirectUri: string;
    /** PKCE code_verifier when oauth.usePkce === true; ignored otherwise. */
    codeVerifier?: string;
  },
): Promise<CodeExchangeResult | { error: string }> {
  const entry = getServerEntry(serverId);
  if (!entry || !entry.oauth) {
    return { error: `Unknown OAuth server "${serverId}"` };
  }
  const oauth = entry.oauth;

  const creds = resolveCredentials(oauth);
  if (!creds) {
    return { error: `${entry.displayName} OAuth credentials not configured on server` };
  }

  if (oauth.usePkce && !args.codeVerifier) {
    return { error: "PKCE code_verifier missing — restart the connection flow" };
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: args.code,
    redirect_uri: args.redirectUri,
  });
  if (oauth.usePkce && args.codeVerifier) {
    body.set("code_verifier", args.codeVerifier);
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  applyClientAuth(oauth, creds, headers, body);

  let tokenData: Record<string, unknown>;
  try {
    const res = await fetch(oauth.tokenUrl, {
      method: "POST",
      headers,
      body: body.toString(),
    });
    tokenData = (await res.json()) as Record<string, unknown>;
    if (!res.ok || typeof tokenData.access_token !== "string") {
      console.error(`[mcp-oauth ${serverId}] Code exchange failed:`, tokenData);
      const desc = (tokenData.error_description ?? tokenData.error) as string | undefined;
      return { error: desc ?? "token_exchange_failed" };
    }
  } catch (err) {
    console.error(`[mcp-oauth ${serverId}] Code exchange threw:`, err);
    return { error: "token_exchange_failed" };
  }

  const accessToken = tokenData.access_token as string;
  const refreshToken =
    typeof tokenData.refresh_token === "string" ? tokenData.refresh_token : undefined;
  const expiresIn = typeof tokenData.expires_in === "number" ? tokenData.expires_in : null;
  const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : undefined;

  const metadata = oauth.metadataFromTokenResponse
    ? oauth.metadataFromTokenResponse(tokenData)
    : null;

  return { accessToken, refreshToken, expiresAt, metadata };
}
