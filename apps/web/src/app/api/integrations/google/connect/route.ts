import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { getAuthContext } from "@/lib/supabase/server";
import { GOOGLE_SCOPES } from "@/lib/google";

/** Cookie name for CSRF state token. */
const STATE_COOKIE = "google_oauth_state";

/** GET /api/integrations/google/connect — redirect to Google's OAuth consent screen */
export async function GET(req: NextRequest) {
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

  // Determine the origin for redirect_uri — respect Vercel proxy headers
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
  const redirectUri = `${origin}/api/integrations/google/callback`;

  // Generate CSRF state token
  const state = randomBytes(32).toString("hex");

  // Build authorization URL via googleapis OAuth2 client
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // Forces refresh token even if user previously consented
    scope: [
      GOOGLE_SCOPES.calendar,
      GOOGLE_SCOPES.gmail,
      GOOGLE_SCOPES.drive,
      GOOGLE_SCOPES.email,
    ],
    state,
  });

  // Store state in a short-lived httpOnly cookie for CSRF protection
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60, // 10 minutes
    path: "/",
  });

  return NextResponse.redirect(authUrl);
}
