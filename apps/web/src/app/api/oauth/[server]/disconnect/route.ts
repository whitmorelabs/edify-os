/**
 * DELETE /api/oauth/[server]/disconnect
 *
 * Generic disconnect handler. Hard-deletes the mcp_connections row for the
 * authenticated org + named server. Best-effort revoke of the access token at
 * the provider's revoke endpoint (if the catalog exposes one); revocation
 * failures are logged but do not block the disconnect.
 *
 * Mirrors the existing /api/integrations/canva/disconnect contract — Canva
 * keeps its own dedicated route to avoid surface change for that integration.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, createServiceRoleClient } from "@/lib/supabase/server";
import { decryptIfEncrypted } from "@/lib/crypto";
import { getServerEntry } from "@/lib/mcp/server-catalog";
import { revokeAccessToken } from "@/lib/mcp/oauth-factory";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ server: string }> },
) {
  const { server: serverId } = await params;

  const entry = getServerEntry(serverId);
  if (!entry || entry.authMode !== "oauth") {
    return NextResponse.json(
      { error: `Unknown OAuth server: ${serverId}` },
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

  // Fetch row so we can revoke the token at the provider before deleting locally
  const { data: row } = await serviceClient
    .from("mcp_connections")
    .select("access_token")
    .eq("org_id", orgId)
    .eq("server_name", serverId)
    .maybeSingle();

  if (row?.access_token) {
    try {
      const plaintext = decryptIfEncrypted(
        row.access_token as string,
        `mcp_connections.${serverId}.access_token`,
      );
      if (plaintext) {
        await revokeAccessToken(serverId, plaintext, "access_token");
      }
    } catch (err) {
      console.warn(`[/api/oauth/${serverId}/disconnect] decrypt/revoke skipped:`, err);
    }
  }

  const { error: deleteError } = await serviceClient
    .from("mcp_connections")
    .delete()
    .eq("org_id", orgId)
    .eq("server_name", serverId);

  if (deleteError) {
    console.error(`[/api/oauth/${serverId}/disconnect] delete failed:`, deleteError);
    return NextResponse.json(
      { error: `Failed to disconnect ${entry.displayName}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
