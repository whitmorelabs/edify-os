import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, createServiceRoleClient } from "@/lib/supabase/server";
import { TOOLKIT_SLUG, type SocialPlatform } from "@/lib/composio";

/**
 * GET /api/integrations/composio — list active Composio social connections
 * for the current user's org. Keyed by our `toolkit` slug (which is the same
 * as the Composio toolkit slug, via lib/composio.TOOLKIT_SLUG).
 */
export async function GET() {
  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data, error } = await serviceClient
    .from("composio_connections")
    .select("toolkit, composio_connection_id, display_name, status, created_at")
    .eq("org_id", orgId)
    .eq("status", "active");

  if (error) {
    console.error("[composio GET] DB error:", error);
    return NextResponse.json({ error: "Failed to fetch connections" }, { status: 500 });
  }

  return NextResponse.json({
    connections: data ?? [],
  });
}

/**
 * DELETE /api/integrations/composio?toolkit=instagram — soft-revoke a connection.
 * We flip the row's status to 'revoked' — the actual Composio-side revocation
 * (which calls back to Facebook/LinkedIn/etc.) is left as a follow-up: v1
 * simply stops using the connection on our side. Composio's `connectedAccounts
 * .delete(connectionId)` is the upgrade path when we're ready.
 */
export async function DELETE(req: NextRequest) {
  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("toolkit") as SocialPlatform | null;
  if (!platform || !(platform in TOOLKIT_SLUG)) {
    return NextResponse.json(
      { error: `toolkit must be one of: ${Object.keys(TOOLKIT_SLUG).join(", ")}` },
      { status: 400 }
    );
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { error } = await serviceClient
    .from("composio_connections")
    .update({ status: "revoked", updated_at: new Date().toISOString() })
    .eq("org_id", orgId)
    .eq("toolkit", TOOLKIT_SLUG[platform]);

  if (error) {
    console.error("[composio DELETE] DB error:", error);
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
