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

  // Pre-load agent_config rows so we can map config_id → role_slug.
  // Many conversations were created before agent_config_id was wired (the column
  // defaulted to null). We count those conversations using two passes:
  //   1. Conversations with a non-null agent_config_id  → join to agent_configs
  //   2. Conversations with null agent_config_id        → count via tasks.agent_role
  //      (tasks.agent_role is set reliably for every chat response)
  const { data: agentConfigRows } = await serviceClient
    .from("agent_configs")
    .select("id, role_slug")
    .eq("org_id", orgId);

  const configIdToSlug: Record<string, string> = {};
  for (const row of agentConfigRows ?? []) {
    if (row.id && row.role_slug) {
      configIdToSlug[row.id as string] = row.role_slug as string;
    }
  }

  // Pass 1: conversations that have agent_config_id set
  const { data: convByAgent } = await serviceClient
    .from("conversations")
    .select("agent_config_id")
    .eq("org_id", orgId)
    .not("agent_config_id", "is", null)
    .gte("created_at", since);

  const slugCounts: Record<string, number> = {};
  for (const conv of convByAgent ?? []) {
    const slug = configIdToSlug[conv.agent_config_id as string] ?? "unknown";
    if (slug !== "unknown") {
      slugCounts[slug] = (slugCounts[slug] ?? 0) + 1;
    }
  }

  // Pass 2: for conversations missing agent_config_id, use tasks.agent_role as a proxy.
  // Count distinct conversations via tasks (one task per conversation response).
  // We de-duplicate by counting unique tasks grouped by agent_role — not a perfect
  // conversation count, but much better than all zeros.
  const { data: tasksByRole } = await serviceClient
    .from("tasks")
    .select("agent_role")
    .eq("org_id", orgId)
    .gte("created_at", since)
    .not("agent_role", "is", null);

  // Only use tasks to fill in slugs that have NO wired conversations
  const taskSlugCounts: Record<string, number> = {};
  for (const task of tasksByRole ?? []) {
    const slug = task.agent_role as string;
    taskSlugCounts[slug] = (taskSlugCounts[slug] ?? 0) + 1;
  }

  // Merge: prefer wired conversation counts; supplement with task counts for
  // archetypes that still show 0 (likely old conversations with null config_id).
  for (const slug of ARCHETYPE_SLUGS) {
    if ((slugCounts[slug] ?? 0) === 0 && (taskSlugCounts[slug] ?? 0) > 0) {
      slugCounts[slug] = taskSlugCounts[slug];
    }
  }

  // Per-archetype task counts (direct, reliable)
  const taskCountBySlug: Record<string, number> = { ...taskSlugCounts };

  const byArchetype = ARCHETYPE_SLUGS.map((slug) => ({
    slug,
    label: ARCHETYPE_LABELS[slug],
    conversations: slugCounts[slug] ?? 0,
    messages: 0, // message-per-archetype requires a heavier join — deferred
    tasks: taskCountBySlug[slug] ?? 0,
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
