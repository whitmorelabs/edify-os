/**
 * PATCH /api/ripple/actions
 *
 * Update the status of a ripple action (approve / dismiss).
 * Body: { id: string, status: "approved" | "dismissed" }
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest) {
  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { id?: string; status?: string };
  try {
    body = (await req.json()) as { id?: string; status?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, status } = body;
  if (!id || !status) {
    return NextResponse.json(
      { error: "id and status are required" },
      { status: 400 },
    );
  }

  const validStatuses = ["approved", "dismissed"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${validStatuses.join(", ")}` },
      { status: 400 },
    );
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  // Verify the action belongs to this org
  const { data: action, error: fetchError } = await serviceClient
    .from("ripple_actions")
    .select("id, org_id")
    .eq("id", id)
    .eq("org_id", orgId)
    .single();

  if (fetchError || !action) {
    return NextResponse.json(
      { error: "Action not found" },
      { status: 404 },
    );
  }

  const { error: updateError } = await serviceClient
    .from("ripple_actions")
    .update({ status })
    .eq("id", id);

  if (updateError) {
    console.error("[ripple/actions] Update error:", updateError);
    return NextResponse.json(
      { error: "Failed to update action" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, id, status });
}
