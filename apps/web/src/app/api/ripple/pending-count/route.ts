/**
 * GET /api/ripple/pending-count
 *
 * Returns the count of pending ripple actions for the sidebar badge.
 */

import { NextResponse } from "next/server";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";

export async function GET() {
  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ count: 0 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ count: 0 });
  }

  const { count, error } = await serviceClient
    .from("ripple_actions")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("status", "pending");

  if (error) {
    console.error("[ripple/pending-count] DB error:", error);
    return NextResponse.json({ count: 0 });
  }

  return NextResponse.json({ count: count ?? 0 });
}
