import { NextResponse } from "next/server";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";
import type { AgentRoleSlug } from "@/lib/agent-colors";
import { ARCHETYPE_SLUGS } from "@/lib/archetypes";

export type DashboardActivity = {
  id: string;
  agent: AgentRoleSlug;
  action: string;
  time: string;
  status: "completed" | "awaiting_approval";
};

export type DashboardSummary = {
  stats: {
    tasksCompleted: number;
    pendingApprovals: number;
    activeAgents: number;
  };
  recentActivity: DashboardActivity[];
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

  // Run independent queries in parallel
  const [
    { count: tasksCompleted },
    { count: pendingApprovals },
    activeAgentData,
    activityData,
  ] = await Promise.all([
    // Tasks completed for this org
    serviceClient
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "completed"),

    // Pending approvals for this org
    serviceClient
      .from("approvals")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "pending"),

    // Distinct archetypes used in conversations in the last 7 days
    serviceClient
      .from("conversations")
      .select("agent_config_id, agent_configs(role_slug)")
      .eq("org_id", orgId)
      .gte("created_at", sevenDaysAgo),

    // Recent assistant messages for activity feed, joined through conversations to get org_id
    serviceClient
      .from("messages")
      .select("id, content, created_at, conversation_id, conversations!inner(org_id, agent_config_id, agent_configs(role_slug))")
      .eq("conversations.org_id", orgId)
      .eq("role", "assistant")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  // Count distinct archetypes active in last 7 days
  const activeSlugSet = new Set<string>();
  for (const conv of activeAgentData.data ?? []) {
    const slug = (conv.agent_configs as { role_slug?: string } | null)?.role_slug;
    if (slug && (ARCHETYPE_SLUGS as readonly string[]).includes(slug)) {
      activeSlugSet.add(slug);
    }
  }

  // Build activity feed
  const recentActivity: DashboardActivity[] = [];
  for (const msg of activityData.data ?? []) {
    const convMeta = msg.conversations as {
      org_id?: string;
      agent_config_id?: string;
      agent_configs?: { role_slug?: string } | null;
    } | null;
    const slug = convMeta?.agent_configs?.role_slug;
    const validSlug = slug && (ARCHETYPE_SLUGS as readonly string[]).includes(slug)
      ? (slug as AgentRoleSlug)
      : ("executive_assistant" as AgentRoleSlug);

    recentActivity.push({
      id: msg.id as string,
      agent: validSlug,
      action: ((msg.content as string) ?? "").slice(0, 80),
      time: msg.created_at as string,
      status: "completed",
    });
  }

  const summary: DashboardSummary = {
    stats: {
      tasksCompleted: tasksCompleted ?? 0,
      pendingApprovals: pendingApprovals ?? 0,
      activeAgents: activeSlugSet.size,
    },
    recentActivity,
  };

  return NextResponse.json(summary);
}
