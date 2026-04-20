import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";

export type OrgDetails = {
  id: string;
  name: string;
  mission: string | null;
  plan: string;
  anthropic_api_key_hint: string | null;
  ai_enabled: boolean;
};

/**
 * GET /api/org
 * Returns the current user's org details.
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

  const { data: org, error } = await serviceClient
    .from("orgs")
    .select("id, name, mission, plan, anthropic_api_key_hint, ai_enabled")
    .eq("id", orgId)
    .single();

  if (error || !org) {
    console.error("[api/org GET] DB error:", error);
    return NextResponse.json({ error: "Failed to fetch org" }, { status: 500 });
  }

  return NextResponse.json(org as OrgDetails);
}

/**
 * PATCH /api/org
 * Body: { name?: string; mission?: string }
 * Updates org name and/or mission. Requires owner or admin role.
 */
export async function PATCH(req: NextRequest) {
  const { user, orgId, memberId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!memberId) {
    return NextResponse.json({ error: "Member context required" }, { status: 403 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Verify the requesting user is an owner or admin
  const { data: member } = await serviceClient
    .from("members")
    .select("role")
    .eq("id", memberId)
    .single();

  if (!member || !["owner", "admin"].includes(member.role)) {
    return NextResponse.json({ error: "Forbidden: only admins can update org info" }, { status: 403 });
  }

  let body: { name?: string; mission?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Record<string, string> = {};

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ error: "Org name cannot be empty" }, { status: 400 });
    }
    if (name.length > 100) {
      return NextResponse.json({ error: "Org name must be 100 characters or fewer" }, { status: 400 });
    }
    updates.name = name;
  }

  if (typeof body.mission === "string") {
    updates.mission = body.mission.trim();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data: updated, error: updateError } = await serviceClient
    .from("orgs")
    .update(updates)
    .eq("id", orgId)
    .select("id, name, mission, plan, anthropic_api_key_hint, ai_enabled")
    .single();

  if (updateError || !updated) {
    console.error("[api/org PATCH] DB error:", updateError);
    return NextResponse.json({ error: "Failed to update org" }, { status: 500 });
  }

  return NextResponse.json(updated as OrgDetails);
}
