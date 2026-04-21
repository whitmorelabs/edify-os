import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { getAuthContext } from "@/lib/supabase/server";
import { initiateConnection, TOOLKIT_SLUG, type SocialPlatform } from "@/lib/composio";
import { getAppOrigin } from "@/lib/google";

const STATE_COOKIE = "composio_oauth_state";

/**
 * POST /api/integrations/composio/connect
 * Body: { toolkit: 'instagram'|'facebook'|'linkedin'|'tiktok'|'x'|'threads' }
 * Returns: { redirectUrl, connectionId }
 *
 * The client opens redirectUrl in a new window/tab. Composio runs the OAuth
 * flow and redirects the user to the Composio-configured post-connect URL,
 * which we point at /api/integrations/composio/callback. The callback looks
 * up the pending connection id and writes the row into composio_connections.
 */
export async function POST(req: NextRequest) {
  const { user, orgId, memberId } = await getAuthContext();
  if (!user || !orgId || !memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { toolkit?: SocialPlatform };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const platform = body.toolkit;
  if (!platform || !(platform in TOOLKIT_SLUG)) {
    return NextResponse.json(
      { error: `toolkit must be one of: ${Object.keys(TOOLKIT_SLUG).join(", ")}` },
      { status: 400 }
    );
  }

  const toolkitSlug = TOOLKIT_SLUG[platform];
  const origin = getAppOrigin();
  const callbackUrl = `${origin}/api/integrations/composio/callback`;

  // Generate CSRF state token — we bind it to both the orgId and the toolkit
  // so the callback can validate + resolve which toolkit is being completed.
  const state = randomBytes(16).toString("hex");
  const statePayload = JSON.stringify({ state, orgId, platform, memberId });

  try {
    const { connectionId, redirectUrl } = await initiateConnection(
      orgId,
      toolkitSlug,
      callbackUrl
    );

    // Stash pending-connection metadata in an httpOnly cookie so the callback
    // can reconstruct (orgId, platform, connectionId) without a DB round-trip.
    // 10 minute TTL — OAuth dances should finish faster than that.
    const cookieStore = await cookies();
    cookieStore.set(
      STATE_COOKIE,
      Buffer.from(
        JSON.stringify({ state: statePayload, connectionId })
      ).toString("base64"),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 10 * 60,
        path: "/",
      }
    );

    return NextResponse.json({ redirectUrl, connectionId });
  } catch (err) {
    console.error("[composio/connect] Failed to initiate connection:", err);
    const message = err instanceof Error ? err.message : "Composio connection failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
