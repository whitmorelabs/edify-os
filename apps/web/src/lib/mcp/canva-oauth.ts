/**
 * Canva OAuth helpers — Sprint-1-of-MCP-0 backward-compat shim.
 *
 * Background: Sprint 2 of the original MCP wiring (PR #19) shipped Canva-specific
 * OAuth code in this file. Sprint 1 of MCP-0 (this PR) generalized that into a
 * config-driven factory in oauth-factory.ts + server-catalog.ts. This file now
 * re-exports the legacy names that callers expect, delegating to the factory
 * for token operations and continuing to own Canva-specific REST helpers
 * (CanvaApiError, handleCanvaResponse) that are unrelated to OAuth and used by
 * lib/tools/canva-generate-design.ts and lib/tools/canva-export-design.ts.
 *
 * Why we keep this shim instead of editing every caller:
 *   - canva-generate-design.ts, canva-export-design.ts, /api/integrations/canva/*,
 *     /api/admin/canva-test all import from "@/lib/mcp/canva-oauth". Preserving
 *     these import paths means MCP-0 Sprint 1 is purely additive — zero risk
 *     to the production Canva flow.
 *   - The server-catalog entry for Canva (CANVA_ENTRY) carries the same URLs,
 *     scopes, and quirks that used to live as constants here. The factory
 *     reads them from the catalog. Nothing about Canva's runtime behavior
 *     changes.
 *
 * Canva OAuth 2.0 facts (see canva-export-design.ts for the REST API base):
 *   Token URL:      https://api.canva.com/rest/v1/oauth/token
 *   Revoke URL:     https://api.canva.com/rest/v1/oauth/revoke
 *   Authorize URL:  https://www.canva.com/api/oauth/authorize
 *   Auth pattern:   Authorization Code + PKCE (S256), HTTP Basic for client creds,
 *                   single-use refresh tokens, non-cumulative scopes.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getValidAccessToken,
  revokeAccessToken,
  type AccessTokenResult,
} from "@/lib/mcp/oauth-factory";
import { getServerEntry } from "@/lib/mcp/server-catalog";

// ---------------------------------------------------------------------------
// Constants — preserved verbatim for callers that import them by name
// ---------------------------------------------------------------------------

export const CANVA_API_BASE = "https://api.canva.com/rest/v1";
export const CANVA_TOKEN_URL = `${CANVA_API_BASE}/oauth/token`;
export const CANVA_AUTHORIZE_URL = "https://www.canva.com/api/oauth/authorize";

/** server_name used as the mcp_connections row key for Canva. */
export const CANVA_SERVER_NAME = "canva";

/**
 * Canva scopes — re-exported for the existing /api/integrations/canva/connect
 * route. Source of truth lives in server-catalog.ts (CANVA_ENTRY.oauth.scopes);
 * the lookup keeps this in sync without duplicating the list.
 *
 * Canva scopes are NOT cumulative — each must be listed explicitly per request.
 */
export const CANVA_SCOPES =
  getServerEntry(CANVA_SERVER_NAME)?.oauth?.scopes ?? "";

/** Cookie name for CSRF state token — shared by /api/integrations/canva/connect + callback routes. */
export const CANVA_STATE_COOKIE = "canva_oauth_state";

/**
 * Crypto label for the access token — kept stable so log lines from lib/crypto.ts
 * remain searchable by their prior name. The factory uses dynamically-built labels
 * for new servers; Canva retains this constant for log continuity.
 */
export const CRYPTO_LABEL_CANVA_ACCESS_TOKEN = "mcp_connections.canva.access_token";

// ---------------------------------------------------------------------------
// Canva-specific REST error class + response handler
// (NOT OAuth-related — used by canva-generate-design.ts / canva-export-design.ts)
// ---------------------------------------------------------------------------

export class CanvaApiError extends Error {
  /** Full raw body returned by Canva, JSON-stringified — for diagnosable error logging. */
  public readonly rawBody: string;

  constructor(
    public readonly status: number,
    message: string,
    rawBody?: string,
  ) {
    super(message);
    this.name = "CanvaApiError";
    this.rawBody = rawBody ?? "";
  }
}

/**
 * Wraps a fetch Response with Canva's error envelope shape:
 *   { "error": { "code": "...", "message": "...", "request_id": "..." } }
 *
 * Captures the FULL body in CanvaApiError.rawBody so callers can log and
 * surface it (see executeCanvaGenerateTool / executeCanvaExportTool).
 */
export async function handleCanvaResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return response.json() as Promise<T>;
  }

  let body: unknown = null;
  let rawBody = "";
  try {
    body = await response.json();
    rawBody = JSON.stringify(body);
  } catch {
    rawBody = await response.text().catch(() => "");
  }

  const b = body as Record<string, unknown> | null;
  const errObj = b?.error as Record<string, unknown> | undefined;
  const errors = b?.errors as unknown[] | undefined;

  let msg: string = response.statusText || `HTTP ${response.status}`;
  if (typeof errObj?.message === "string") msg = errObj.message;
  else if (typeof errObj?.code === "string") msg = errObj.code;
  else if (Array.isArray(errors) && errors.length > 0) {
    const first = errors[0] as Record<string, unknown>;
    if (typeof first?.message === "string") msg = first.message;
    else if (typeof first?.code === "string") msg = first.code;
  }

  throw new CanvaApiError(response.status, msg, rawBody);
}

// ---------------------------------------------------------------------------
// OAuth helpers — thin wrappers around the factory for legacy callers
// ---------------------------------------------------------------------------

/**
 * Revoke a Canva access or refresh token. Best-effort — never throws.
 */
export async function revokeCanvaToken(
  token: string,
  tokenType: "access_token" | "refresh_token" = "access_token",
): Promise<void> {
  return revokeAccessToken(CANVA_SERVER_NAME, token, tokenType);
}

/**
 * Returns a valid Canva access token for the given org — pattern-match on
 * `accessToken | error | notConnected`. Behavior is identical to the prior
 * implementation; the factory holds the logic now.
 */
export async function getValidCanvaAccessToken(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: SupabaseClient<any>,
  orgId: string,
): Promise<AccessTokenResult> {
  return getValidAccessToken(serviceClient, orgId, CANVA_SERVER_NAME);
}
