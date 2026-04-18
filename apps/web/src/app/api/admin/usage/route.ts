import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";

const ARCHETYPE_COLORS: Record<string, string> = {
  development_director: "bg-emerald-500",
  executive_assistant: "bg-sky-500",
  marketing_director: "bg-amber-500",
  programs_director: "bg-violet-500",
  hr_volunteer_coordinator: "bg-indigo-500",
  events_director: "bg-rose-500",
};

const ARCHETYPE_LABELS: Record<string, string> = {
  development_director: "Director of Development",
  marketing_director: "Marketing Director",
  executive_assistant: "Executive Assistant",
  programs_director: "Programs Director",
  hr_volunteer_coordinator: "HR & Volunteer Coordinator",
  events_director: "Events Director",
};

export async function GET(req: NextRequest) {
  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "7", 10);
  const validDays = [7, 30, 90].includes(days) ? days : 7;
  const since = new Date(Date.now() - validDays * 24 * 60 * 60 * 1000).toISOString();

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Count conversations
  const { count: totalConversations } = await serviceClient
    .from("conversations")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId)
    .gte("created_at", since);

  // Count messages
  const { count: totalMessages } = await serviceClient
    .from("messages")
    .select("*", { count: "exact", head: true })
    .gte("created_at", since);

  // Count tasks
  const { count: tasksCreated } = await serviceClient
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId)
    .gte("created_at", since);

  // Count heartbeat runs
  const { count: heartbeatsDelivered } = await serviceClient
    .from("heartbeat_runs")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed")
    .gte("started_at", since);

  // Count documents
  const { count: documentsUploaded } = await serviceClient
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId)
    .gte("created_at", since);

  // Per-archetype breakdown via conversations
  // Conversations store agent_config_id; join to agent_configs for role_slug
  const { data: convByAgent } = await serviceClient
    .from("conversations")
    .select("agent_config_id, agent_configs(role_slug)")
    .eq("org_id", orgId)
    .gte("created_at", since);

  const slugCounts: Record<string, number> = {};
  for (const conv of convByAgent ?? []) {
    const slug = (conv.agent_configs as { role_slug?: string } | null)?.role_slug ?? "unknown";
    slugCounts[slug] = (slugCounts[slug] ?? 0) + 1;
  }

  const byArchetype = Object.entries(ARCHETYPE_LABELS).map(([slug, label]) => ({
    slug,
    label,
    conversations: slugCounts[slug] ?? 0,
    messages: 0, // Phase 1: leave as 0 — message-per-archetype requires a join
    tasks: 0,
    color: ARCHETYPE_COLORS[slug] ?? "bg-gray-500",
  }));

  return NextResponse.json({
    period: `Last ${validDays} days`,
    summary: {
      totalConversations: totalConversations ?? 0,
      totalMessages: totalMessages ?? 0,
      tasksCreated: tasksCreated ?? 0,
      heartbeatsDelivered: heartbeatsDelivered ?? 0,
      documentsUploaded: documentsUploaded ?? 0,
    },
    byArchetype,
    hourlyDistribution: [], // Phase 2: compute from messages.created_at
  });
}
