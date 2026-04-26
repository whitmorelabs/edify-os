/**
 * DELETE /api/integrations/canva/disconnect
 *
 * Disconnects the org's Canva integration.
 *
 * Steps:
 *   1. Auth gate
 *   2. Fetch the stored encrypted tokens
 *   3. Revoke the access token at Canva's revocation endpoint (best-effort)
 *   4. Hard-delete the mcp_connections row
 *
 * We hard-delete rather than soft-delete because mcp_connections is an
 * ephemeral token store — there is no audit requirement for these rows
 * (contrast with the integrations table which soft-deletes for audit history).
 */

import { NextResponse } from "next/server";
import { getAuthContext, createServiceRoleClient } from "@/lib/supabase/server";
import { decryptIfEncrypted } from "@/lib/crypto";
import {
  revokeCanvaToken,
  CANVA_SERVER_NAME,
  CRYPTO_LABEL_CANVA_ACCESS_TOKEN,
} from "@/lib/mcp/canva-oauth";

export async function DELETE() {
  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Fetch current row so we can revoke the token before deleting
  const { data: row } = await serviceClient
    .from("mcp_connections")
    .select("access_token")
    .eq("org_id", orgId)
    .eq("server_name", CANVA_SERVER_NAME)
    .maybeSingle();

  // Best-effort revocation — do not block disconnect if revocation fails
  if (row?.access_token) {
    try {
      const plaintext = decryptIfEncrypted(
        row.access_token as string,
        CRYPTO_LABEL_CANVA_ACCESS_TOKEN
      );
      if (plaintext) {
        await revokeCanvaToken(plaintext, "access_token");
      }
    } catch (err) {
      console.warn("[canva/disconnect] Could not decrypt token for revocation:", err);
    }
  }

  // Hard-delete the row
  const { error: deleteError } = await serviceClient
    .from("mcp_connections")
    .delete()
    .eq("org_id", orgId)
    .eq("server_name", CANVA_SERVER_NAME);

  if (deleteError) {
    console.error("[canva/disconnect] DB delete error:", deleteError);
    return NextResponse.json({ error: "Failed to disconnect Canva" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
