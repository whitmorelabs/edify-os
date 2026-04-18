import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { cookies } from "next/headers";
import { getAuthContext, createServiceRoleClient } from "@/lib/supabase/server";
import { GOOGLE_SCOPES, GOOGLE_INTEGRATION_TYPES, SCOPES_BY_TYPE } from "@/lib/google";

/** Cookie name for CSRF state token (must match connect/route.ts). */
const STATE_COOKIE = "google_oauth_state";

/** GET /api/integrations/google/callback — receives code from Google, stores tokens */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  // Determine origin for redirect_uri (must match what connect/ used exactly)
  const forwardedProto =
    req.headers.get("x-forwarded-proto") ?? req.headers.get("x-forwarded-protocol");
  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = forwardedHost ?? req.headers.get("host") ?? "localhost:3000";
  const proto = forwardedProto
    ? forwardedProto.split(",")[0].trim()
    : host.startsWith("localhost")
    ? "http"
    : "https";
  const origin = `${proto}://${host}`;

  // --- User denied access ---
  if (errorParam) {
    return NextResponse.redirect(
      `${origin}/dashboard/integrations?google=denied&reason=${encodeURIComponent(errorParam)}`
    );
  }

  // --- CSRF state validation ---
  const cookieStore = await cookies();
  const storedState = cookieStore.get(STATE_COOKIE)?.value;

  if (!storedState || storedState !== state) {
    return NextResponse.json(
      { error: "OAuth state mismatch (possible CSRF attempt)" },
      { status: 400 }
    );
  }

  if (!code) {
    return NextResponse.json(
      { error: "No authorization code returned from Google" },
      { status: 400 }
    );
  }

  // --- Auth gate ---
  const { user, memberId, orgId } = await getAuthContext();
  if (!user || !memberId || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Google OAuth credentials not configured on server" },
      { status: 500 }
    );
  }

  const redirectUri = `${origin}/api/integrations/google/callback`;

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

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
    return NextResponse.redirect(
      `${origin}/dashboard/integrations?google=denied&reason=token_exchange_failed`
    );
  }

  if (!tokens.access_token) {
    return NextResponse.redirect(
      `${origin}/dashboard/integrations?google=denied&reason=no_access_token`
    );
  }

  // Fetch the connected Google account email
  let googleEmail: string | null = null;
  try {
    const userInfoRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );
    if (userInfoRes.ok) {
      const userInfo = (await userInfoRes.json()) as { email?: string };
      googleEmail = userInfo.email ?? null;
    }
  } catch (err) {
    console.error("[google/callback] Failed to fetch userinfo:", err);
    // Non-fatal — we'll store tokens without email
  }

  // Compute expiry timestamp
  const tokenExpiresAt = tokens.expiry_date
    ? new Date(tokens.expiry_date).toISOString()
    : null;

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Upsert 3 rows — one per Google integration type
  // They share the same access+refresh token set; scopes split by service type
  const upsertRows = GOOGLE_INTEGRATION_TYPES.map((type) => {
    const row: Record<string, unknown> = {
      org_id: orgId,
      type,
      access_token_encrypted: tokens.access_token,
      scopes: SCOPES_BY_TYPE[type],
      config: { google_email: googleEmail },
      connected_by: memberId,
      status: "active",
      updated_at: new Date().toISOString(),
    };
    // Only set refresh_token if present (Google reuses old token if user was already consented;
    // prompt:consent should force a new one, but be defensive)
    if (tokens.refresh_token) {
      row.refresh_token_encrypted = tokens.refresh_token;
    }
    if (tokenExpiresAt) {
      row.token_expires_at = tokenExpiresAt;
    }
    return row;
  });

  for (const row of upsertRows) {
    const { error: upsertError } = await serviceClient
      .from("integrations")
      .upsert(row, { onConflict: "org_id,type" });

    if (upsertError) {
      console.error(`[google/callback] Failed to upsert ${row.type}:`, upsertError);
      return NextResponse.redirect(
        `${origin}/dashboard/integrations?google=denied&reason=db_error`
      );
    }
  }

  // Clear the state cookie
  cookieStore.delete(STATE_COOKIE);

  return NextResponse.redirect(`${origin}/dashboard/integrations?google=connected`);
}
