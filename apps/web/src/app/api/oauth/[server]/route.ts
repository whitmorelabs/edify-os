/**
 * GET /api/oauth/[server]
 *
 * Generic connection-status endpoint. Returns whether the authenticated org
 * has an active mcp_connections row for the named server, plus any per-server
 * metadata harvested at connect time (workspace name, email, etc).
 *
 * Response: { connected: boolean; metadata: Record<string, unknown> }
 *
 * Wire-compatible with the existing /api/integrations/canva GET shape; new
 * connectors (Notion etc.) can reuse this without a per-server status route.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, createServiceRoleClient } from "@/lib/supabase/server";
import { getServerEntry } from "@/lib/mcp/server-catalog";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ server: string }> },
) {
  const { server: serverId } = await params;

  const entry = getServerEntry(serverId);
  if (!entry) {
    return NextResponse.json(
      { error: `Unknown server: ${serverId}` },
      { status: 404 },
    );
  }

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
    .eq("server_name", serverId)
    .maybeSingle();

  if (error) {
    console.error(`[/api/oauth/${serverId} GET] DB error:`, error);
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
  }

  return NextResponse.json({
    connected: data !== null,
    metadata: (data?.metadata as Record<string, unknown> | null) ?? {},
  });
}
