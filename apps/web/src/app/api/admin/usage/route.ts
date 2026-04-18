import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";
import { ARCHETYPE_LABELS, ARCHETYPE_COLORS, ARCHETYPE_SLUGS } from "@/lib/archetypes";

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

  // Run all independent count queries in parallel
  const [
    { count: totalConversations },
    { count: totalMessages },
    { count: tasksCreated },
    { count: heartbeatsDelivered },
    { count: documentsUploaded },
  ] = await Promise.all([
    // Conversations — org_id direct
    serviceClient
      .from("conversations")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .gte("created_at", since),

    // Messages — join through conversations to filter by org_id
    serviceClient
      .from("messages")
      .select("conversation_id, conversations!inner(org_id)", { count: "exact", head: true })
      .eq("conversations.org_id", orgId)
      .gte("created_at", since),

    // Tasks — org_id direct
    serviceClient
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .gte("created_at", since),

    // Heartbeat runs — join through heartbeat_jobs to filter by org_id
    serviceClient
      .from("heartbeat_runs")
      .select("job_id, heartbeat_jobs!inner(org_id)", { count: "exact", head: true })
      .eq("heartbeat_jobs.org_id", orgId)
      .eq("status", "completed")
      .gte("started_at", since),

    // Documents — org_id direct
    serviceClient
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .gte("created_at", since),
  ]);

  // Per-archetype breakdown via conversations join to agent_configs
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

  const byArchetype = ARCHETYPE_SLUGS.map((slug) => ({
    slug,
    label: ARCHETYPE_LABELS[slug],
    conversations: slugCounts[slug] ?? 0,
    messages: 0, // message-per-archetype requires a join — deferred
    tasks: 0,
    color: ARCHETYPE_COLORS[slug],
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
    hourlyDistribution: [],
  });
}
