import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { cookies } from "next/headers";
import { getAuthContext, createServiceRoleClient } from "@/lib/supabase/server";
import {
  GOOGLE_INTEGRATION_TYPES,
  SCOPES_BY_TYPE,
  STATE_COOKIE,
  getAppOrigin,
} from "@/lib/google";

/** GET /api/integrations/google/callback — receives code from Google, stores tokens */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  // Pin origin from env — never derive from request headers (open-redirect risk)
  const origin = getAppOrigin();

  // Helper: clear state cookie and redirect
  async function clearAndRedirect(target: string): Promise<NextResponse> {
    const cookieStore = await cookies();
    cookieStore.delete(STATE_COOKIE);
    return NextResponse.redirect(target);
  }

  // --- User denied access ---
  if (errorParam) {
    return clearAndRedirect(
      `${origin}/dashboard/integrations?google=denied&reason=${encodeURIComponent(errorParam)}`
    );
  }

  // --- CSRF state validation ---
  const cookieStore = await cookies();
  const storedState = cookieStore.get(STATE_COOKIE)?.value;

  if (!storedState || storedState !== state) {
    // Don't clear the cookie here — it's either already absent (replay) or mismatched
    return NextResponse.json(
      { error: "OAuth state mismatch (possible CSRF attempt)" },
      { status: 400 }
    );
  }

  if (!code) {
    return clearAndRedirect(
      `${origin}/dashboard/integrations?google=denied&reason=no_code`
    );
  }

  // --- Auth gate ---
  const { user, memberId, orgId } = await getAuthContext();
  if (!user || !memberId || !orgId) {
    return clearAndRedirect(
      `${origin}/dashboard/integrations?google=denied&reason=unauthorized`
    );
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return clearAndRedirect(
      `${origin}/dashboard/integrations?google=denied&reason=server_config_error`
    );
  }

  const redirectUri = `${origin}/api/integrations/google/callback`;

  const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);

  // Exchange code for tokens
  let tokens: {
    access_token?: string | null;
    refresh_token?: string | null;
    expiry_date?: number | null;
    scope?: string | null;
  };

  try {
    const { tokens: rawTokens } = await oauth2Client.getToken(code);
    tokens = rawTokens;
  } catch (err) {
    console.error("[google/callback] Token exchange failed:", err);
    return clearAndRedirect(
      `${origin}/dashboard/integrations?google=denied&reason=token_exchange_failed`
    );
  }

  if (!tokens.access_token) {
    return clearAndRedirect(
      `${origin}/dashboard/integrations?google=denied&reason=no_access_token`
    );
  }

  // Fetch the connected Google account email — hard-fail if non-200 (M3)
  let googleEmail: string | null = null;
  try {
    const userInfoRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );
    if (userInfoRes.status !== 200) {
      console.error(
        "[google/callback] Userinfo returned non-200:",
        userInfoRes.status
      );
      return clearAndRedirect(
        `${origin}/dashboard/integrations?google=denied&reason=userinfo_failed`
      );
    }
    const userInfo = (await userInfoRes.json()) as { email?: string };
    googleEmail = userInfo.email ?? null;
  } catch (err) {
    console.error("[google/callback] Failed to fetch userinfo:", err);
    return clearAndRedirect(
      `${origin}/dashboard/integrations?google=denied&reason=userinfo_failed`
    );
  }

  // Compute expiry timestamp
  const tokenExpiresAt = tokens.expiry_date
    ? new Date(tokens.expiry_date).toISOString()
    : null;

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return clearAndRedirect(
      `${origin}/dashboard/integrations?google=denied&reason=db_unavailable`
    );
  }

  // Batch upsert all 3 rows in one call (H3)
  // They share the same access+refresh token set; scopes split by service type
  const sharedFields: Record<string, unknown> = {
    org_id: orgId,
    access_token_encrypted: tokens.access_token,
    config: { google_email: googleEmail },
    connected_by: memberId,
    status: "active",
    updated_at: new Date().toISOString(),
  };
  if (tokens.refresh_token) {
    sharedFields.refresh_token_encrypted = tokens.refresh_token;
  }
  if (tokenExpiresAt) {
    sharedFields.token_expires_at = tokenExpiresAt;
  }

  const upsertRows = GOOGLE_INTEGRATION_TYPES.map((type) => ({
    ...sharedFields,
    type,
    scopes: SCOPES_BY_TYPE[type],
  }));

  const { error: upsertError } = await serviceClient
    .from("integrations")
    .upsert(upsertRows, { onConflict: "org_id,type" });

  if (upsertError) {
    console.error("[google/callback] Failed to upsert integrations:", upsertError);
    return clearAndRedirect(
      `${origin}/dashboard/integrations?google=denied&reason=db_error`
    );
  }

  return clearAndRedirect(`${origin}/dashboard/integrations?google=connected`);
}
