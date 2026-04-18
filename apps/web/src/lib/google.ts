import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const GOOGLE_SCOPES = {
  calendar: "https://www.googleapis.com/auth/calendar",
  gmail: "https://www.googleapis.com/auth/gmail.modify",
  drive: "https://www.googleapis.com/auth/drive.file",
  email: "https://www.googleapis.com/auth/userinfo.email",
} as const;

export const GOOGLE_INTEGRATION_TYPES = [
  "gmail",
  "google_calendar",
  "google_drive",
] as const;

export type GoogleIntegrationType = (typeof GOOGLE_INTEGRATION_TYPES)[number];

/** Scopes stored per integration row — mirrors what we request but split by service. */
export const SCOPES_BY_TYPE: Record<GoogleIntegrationType, string[]> = {
  gmail: [GOOGLE_SCOPES.gmail],
  google_calendar: [GOOGLE_SCOPES.calendar],
  google_drive: [GOOGLE_SCOPES.drive],
};

// ---------------------------------------------------------------------------
// Token refresh helper
// ---------------------------------------------------------------------------

/**
 * Returns a valid Google access token for the given org + integration type.
 * Reads the integrations row, refreshes if within 60s of expiry, and updates
 * all 3 Google rows (they share a token set) when refreshing.
 *
 * Returns { accessToken: string } or { error: NextResponse } — caller pattern
 * matches getAnthropicClientForOrg.
 *
 * Usage:
 *   const result = await getValidGoogleAccessToken(serviceClient, orgId, 'google_calendar');
 *   if ('error' in result) return result.error;
 *   const { accessToken } = result;
 */
export async function getValidGoogleAccessToken(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: SupabaseClient<any>,
  orgId: string,
  integrationType: GoogleIntegrationType
): Promise<{ accessToken: string } | { error: NextResponse }> {
  // Read the integration row
  const { data: integration, error: dbError } = await serviceClient
    .from("integrations")
    .select(
      "id, access_token_encrypted, refresh_token_encrypted, token_expires_at, status"
    )
    .eq("org_id", orgId)
    .eq("type", integrationType)
    .single();

  if (dbError || !integration) {
    return {
      error: NextResponse.json(
        { error: "Google integration not connected" },
        { status: 404 }
      ),
    };
  }

  if (integration.status !== "active") {
    return {
      error: NextResponse.json(
        { error: "Google integration not connected" },
        { status: 404 }
      ),
    };
  }

  const accessToken = integration.access_token_encrypted as string | null;
  const refreshToken = integration.refresh_token_encrypted as string | null;
  const expiresAt = integration.token_expires_at as string | null;

  if (!accessToken) {
    return {
      error: NextResponse.json(
        { error: "Google integration missing access token" },
        { status: 500 }
      ),
    };
  }

  // Check if token is still valid (with 60s buffer)
  if (expiresAt) {
    const expiresMs = new Date(expiresAt).getTime();
    const nowMs = Date.now();
    if (expiresMs - nowMs > 60_000) {
      // Token still good
      return { accessToken };
    }
  }

  // Token expired (or no expiry stored) — refresh
  if (!refreshToken) {
    return {
      error: NextResponse.json(
        {
          error:
            "Google token expired and no refresh token available. Please reconnect Google.",
        },
        { status: 401 }
      ),
    };
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return {
      error: NextResponse.json(
        { error: "Google OAuth credentials not configured on server" },
        { status: 500 }
      ),
    };
  }

  // POST to Google's token endpoint with form-urlencoded body
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString(),
  });

  if (!tokenRes.ok) {
    const errBody = await tokenRes.text();
    console.error("[google] Token refresh failed:", errBody);
    return {
      error: NextResponse.json(
        { error: "Google token refresh failed. Please reconnect Google." },
        { status: 401 }
      ),
    };
  }

  const tokens = (await tokenRes.json()) as {
    access_token: string;
    expires_in?: number;
  };

  const newAccessToken = tokens.access_token;
  const newExpiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null;

  // Update ALL 3 Google integration rows for this org (they share a token set)
  const updatePayload: Record<string, unknown> = {
    access_token_encrypted: newAccessToken,
    updated_at: new Date().toISOString(),
  };
  if (newExpiresAt) updatePayload.token_expires_at = newExpiresAt;

  const { error: updateError } = await serviceClient
    .from("integrations")
    .update(updatePayload)
    .eq("org_id", orgId)
    .in("type", GOOGLE_INTEGRATION_TYPES);

  if (updateError) {
    console.error("[google] Failed to update refreshed token:", updateError);
    // Non-fatal — return the fresh token even if the DB update failed
  }

  return { accessToken: newAccessToken };
}
