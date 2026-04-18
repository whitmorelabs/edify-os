import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { getAuthContext } from "@/lib/supabase/server";
import { GOOGLE_SCOPES, STATE_COOKIE, getAppOrigin } from "@/lib/google";

/** GET /api/integrations/google/connect — redirect to Google's OAuth consent screen */
export async function GET() {
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

  // Pin redirect_uri from env — never derive from request headers (open-redirect risk)
  const origin = getAppOrigin();
  const redirectUri = `${origin}/api/integrations/google/callback`;

  // Generate CSRF state token
  const state = randomBytes(32).toString("hex");

  // Build authorization URL via google-auth-library OAuth2Client (~50KB vs 4MB googleapis)
  const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);

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
