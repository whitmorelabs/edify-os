import { NextResponse } from "next/server";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";

export type AdminStats = {
  teamConversationsThisWeek: number;
  tasksCompleted: number;
  activeTeamMembers: number;
  connectedIntegrations: number;
};

export async function GET() {
  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: teamConversationsThisWeek },
    { count: tasksCompleted },
    { count: activeTeamMembers },
    { count: connectedIntegrations },
  ] = await Promise.all([
    // Conversations in the last 7 days for this org
    serviceClient
      .from("conversations")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .gte("created_at", sevenDaysAgo),

    // Tasks completed for this org
    serviceClient
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "completed"),

    // Human team members in this org (members table has no active flag —
    // every member row is an active seat)
    serviceClient
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId),

    // Integrations currently connected (status='active', not expired/revoked)
    serviceClient
      .from("integrations")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "active"),
  ]);

  const stats: AdminStats = {
    teamConversationsThisWeek: teamConversationsThisWeek ?? 0,
    tasksCompleted: tasksCompleted ?? 0,
    activeTeamMembers: activeTeamMembers ?? 0,
    connectedIntegrations: connectedIntegrations ?? 0,
  };

  return NextResponse.json(stats);
}
