import { NextResponse } from "next/server";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";

export type OrgMember = {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: string;
  joinedAt: string;
  avatarInitials: string;
};

/**
 * GET /api/org/members
 * Returns all members of the current user's org, enriched with auth user info.
 * Uses listUsers (one call) to avoid N+1 per-member lookups.
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

  const { data: members, error } = await serviceClient
    .from("members")
    .select("id, role, created_at, user_id")
    .eq("org_id", orgId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[api/org/members GET] DB error:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }

  // Fetch all auth users in one call — avoids N+1 per-member requests
  const { data: usersPage } = await serviceClient.auth.admin.listUsers({ perPage: 200 });
  const userMap = new Map<
    string,
    { email?: string; full_name?: string }
  >(
    (usersPage?.users ?? []).map((u) => [
      u.id,
      {
        email: u.email,
        full_name: u.user_metadata?.full_name as string | undefined,
      },
    ])
  );

  const enriched: OrgMember[] = (members ?? []).map((m) => {
    const u = userMap.get(m.user_id);
    const displayName = u?.full_name ?? u?.email ?? "(unknown)";
    return {
      id: m.id,
      userId: m.user_id,
      email: u?.email ?? "(unknown)",
      name: displayName,
      role: m.role,
      joinedAt: m.created_at,
      avatarInitials: displayName
        .split(" ")
        .map((p: string) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
    };
  });

  return NextResponse.json({ members: enriched, currentUserId: user.id });
}
