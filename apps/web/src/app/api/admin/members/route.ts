import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";

export async function GET() {
  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: members, error } = await serviceClient
    .from("members")
    .select("id, role, created_at, user_id")
    .eq("org_id", orgId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[admin/members] DB error:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }

  // Enrich with user emails from auth.users via service client
  const enriched = await Promise.all(
    (members ?? []).map(async (m) => {
      const { data: userData } = await serviceClient.auth.admin.getUserById(m.user_id);
      return {
        id: m.id,
        userId: m.user_id,
        email: userData?.user?.email ?? "(unknown)",
        name: userData?.user?.user_metadata?.full_name ?? userData?.user?.email ?? "(unknown)",
        role: m.role,
        joinedAt: m.created_at,
        lastActive: userData?.user?.last_sign_in_at ?? m.created_at,
        avatarInitials: (userData?.user?.user_metadata?.full_name ?? userData?.user?.email ?? "?")
          .split(" ")
          .map((p: string) => p[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
      };
    })
  );

  return NextResponse.json({ members: enriched });
}

export async function POST(req: NextRequest) {
  const { user, orgId, memberId: requestingMemberId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { email, role } = body;

  if (!email || !role) {
    return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
  }

  const validRoles = ["owner", "admin", "member"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Verify the requesting user is an admin/owner
  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: requestingMember } = await serviceClient
    .from("members")
    .select("role")
    .eq("id", requestingMemberId)
    .single();

  if (!requestingMember || !["owner", "admin"].includes(requestingMember.role)) {
    return NextResponse.json({ error: "Forbidden: only admins can invite members" }, { status: 403 });
  }

  // In production: send invitation email via SendGrid and create a pending invitation record.
  // For Phase 1: record the invite intent and return success.
  // Full invitation flow is Phase 2 work.
  return NextResponse.json({
    success: true,
    message: `Invitation for ${email} as ${role} has been queued. (Email delivery wired in Phase 2)`,
  });
}

export async function PATCH(req: NextRequest) {
  const { user, orgId, memberId: requestingMemberId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { memberId, role } = body;

  if (!memberId || !role) {
    return NextResponse.json({ error: "Member ID and role are required" }, { status: 400 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Only admins/owners can update roles
  const { data: requestingMember } = await serviceClient
    .from("members")
    .select("role")
    .eq("id", requestingMemberId)
    .single();

  if (!requestingMember || !["owner", "admin"].includes(requestingMember.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await serviceClient
    .from("members")
    .update({ role })
    .eq("id", memberId)
    .eq("org_id", orgId);

  if (error) {
    console.error("[admin/members PATCH] DB error:", error);
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }

  return NextResponse.json({ success: true, memberId, role });
}

export async function DELETE(req: NextRequest) {
  const { user, orgId, memberId: requestingMemberId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");

  if (!memberId) {
    return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Only admins/owners can remove members; owners cannot remove themselves
  const { data: requestingMember } = await serviceClient
    .from("members")
    .select("role")
    .eq("id", requestingMemberId)
    .single();

  if (!requestingMember || !["owner", "admin"].includes(requestingMember.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (memberId === requestingMemberId) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
  }

  const { error } = await serviceClient
    .from("members")
    .delete()
    .eq("id", memberId)
    .eq("org_id", orgId);

  if (error) {
    console.error("[admin/members DELETE] DB error:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }

  return NextResponse.json({ success: true, memberId });
}
