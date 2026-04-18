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

  // Fetch all auth users in one call and build a lookup map — avoids N+1 per-member requests
  const { data: usersPage } = await serviceClient.auth.admin.listUsers({ perPage: 200 });
  const userMap = new Map<string, { email?: string; full_name?: string; last_sign_in_at?: string }>(
    (usersPage?.users ?? []).map((u) => [
      u.id,
      {
        email: u.email,
        full_name: u.user_metadata?.full_name as string | undefined,
        last_sign_in_at: u.last_sign_in_at,
      },
    ])
  );

  const enriched = (members ?? []).map((m) => {
    const u = userMap.get(m.user_id);
    const displayName = u?.full_name ?? u?.email ?? "(unknown)";
    return {
      id: m.id,
      userId: m.user_id,
      email: u?.email ?? "(unknown)",
      name: displayName,
      role: m.role,
      joinedAt: m.created_at,
      lastActive: u?.last_sign_in_at ?? m.created_at,
      avatarInitials: displayName
        .split(" ")
        .map((p: string) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
    };
  });

  return NextResponse.json({ members: enriched });
}

export async function POST(req: NextRequest) {
  const { user, orgId, memberId: requestingMemberId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Guard: user must have a members row to perform write operations
  if (!requestingMemberId) {
    return NextResponse.json({ error: "Member context required" }, { status: 403 });
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

  return NextResponse.json({
    success: true,
    message: `Invitation for ${email} as ${role} has been queued.`,
  });
}

export async function PATCH(req: NextRequest) {
  const { user, orgId, memberId: requestingMemberId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Guard: user must have a members row to perform write operations
  if (!requestingMemberId) {
    return NextResponse.json({ error: "Member context required" }, { status: 403 });
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

  // Guard: user must have a members row to perform write operations
  if (!requestingMemberId) {
    return NextResponse.json({ error: "Member context required" }, { status: 403 });
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
