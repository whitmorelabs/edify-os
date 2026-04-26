/**
 * GET /api/integrations/canva
 *
 * Returns the current Canva connection status for the authenticated org.
 * Used by the CanvaIntegrationCard component to show connected/disconnected state.
 *
 * Response: { connected: boolean; email: string | null }
 */

import { NextResponse } from "next/server";
import { getAuthContext, createServiceRoleClient } from "@/lib/supabase/server";
import { CANVA_SERVER_NAME } from "@/lib/mcp/canva-oauth";

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
    .from("mcp_connections")
    .select("metadata")
    .eq("org_id", orgId)
    .eq("server_name", CANVA_SERVER_NAME)
    .maybeSingle();

  if (error) {
    console.error("[canva GET] DB error:", error);
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
  }

  const connected = data !== null;
  const email = connected
    ? ((data?.metadata as { canva_email?: string | null })?.canva_email ?? null)
    : null;

  return NextResponse.json({ connected, email });
}
