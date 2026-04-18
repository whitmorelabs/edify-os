import { NextResponse } from "next/server";
import { getAuthContext, createServiceRoleClient } from "@/lib/supabase/server";
import {
  GOOGLE_INTEGRATION_TYPES,
  type GoogleIntegrationConfig,
} from "@/lib/google";

/** GET /api/integrations/google — current Google connection status for the org */
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
    .from("integrations")
    .select("type, status, config")
    .eq("org_id", orgId)
    .eq("status", "active")
    .in("type", GOOGLE_INTEGRATION_TYPES)
    .limit(1);

  if (error) {
    console.error("[google GET] DB error:", error);
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
  }

  const connected = (data ?? []).length > 0;
  const googleEmail = connected
    ? ((data![0].config as GoogleIntegrationConfig)?.google_email ?? null)
    : null;

  return NextResponse.json({ connected, email: googleEmail });
}

/**
 * DELETE /api/integrations/google — soft-disconnect Google (marks all 3 rows revoked).
 * Soft-delete matches the pattern in /api/integrations (DELETE handler) which uses
 * status='revoked'. Hard-delete is avoided so audit history is preserved.
 */
export async function DELETE() {
  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { error } = await serviceClient
    .from("integrations")
    .update({ status: "revoked", updated_at: new Date().toISOString() })
    .eq("org_id", orgId)
    .in("type", GOOGLE_INTEGRATION_TYPES);

  if (error) {
    console.error("[google DELETE] DB error:", error);
    return NextResponse.json({ error: "Failed to disconnect Google" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
