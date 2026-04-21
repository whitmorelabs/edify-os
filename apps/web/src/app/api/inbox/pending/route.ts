import { NextResponse } from "next/server";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";
import type { AgentRoleSlug } from "@/lib/agent-colors";
import { ARCHETYPE_SLUGS } from "@/lib/archetypes";

export interface InboxItem {
  id: string;
  agent: AgentRoleSlug;
  title: string;
  summary: string;
  preview: string;
  confidence: number;
  urgency: "low" | "normal" | "high" | "critical";
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  /**
   * All inbox items now come from the `approvals` table — items that
   * genuinely require a user decision (approve / edit / reject). The old
   * "messages" fallback (long assistant replies surfaced as fake inbox items)
   * was removed because it leaked completed agent work into the decision queue.
   * Completed artifacts now live on the Tasks page instead.
   */
  source: "approvals";
}

export async function GET() {
  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const validSlugs = ARCHETYPE_SLUGS as readonly string[];
  const items: InboxItem[] = [];

  // Inbox = strictly approvals. Heartbeat findings also arrive as approvals
  // when the triage path decides user attention is warranted; non-decision
  // artifacts (chat drafts, social posts, etc.) go to /api/tasks/recent.
  const { data: approvalsData } = await serviceClient
    .from("approvals")
    .select(`
      id,
      title,
      summary,
      output_preview,
      confidence_score,
      urgency,
      status,
      created_at,
      agent_config_id,
      agent_configs(role_slug)
    `)
    .eq("org_id", orgId)
    .in("status", ["pending", "approved", "rejected"])
    .order("created_at", { ascending: false })
    .limit(20);

  for (const ap of approvalsData ?? []) {
    const slug = (ap.agent_configs as { role_slug?: string } | null)?.role_slug;
    const agentSlug =
      slug && validSlugs.includes(slug)
        ? (slug as AgentRoleSlug)
        : ("executive_assistant" as AgentRoleSlug);

    const rawUrgency = ap.urgency as string;
    const urgency =
      rawUrgency === "low" || rawUrgency === "normal" || rawUrgency === "high" || rawUrgency === "critical"
        ? (rawUrgency as "low" | "normal" | "high" | "critical")
        : "normal";

    const rawStatus = ap.status as string;
    const status =
      rawStatus === "approved" || rawStatus === "rejected"
        ? (rawStatus as "approved" | "rejected")
        : "pending";

    items.push({
      id: ap.id as string,
      agent: agentSlug,
      title: ap.title as string,
      summary: ap.summary as string,
      preview: (ap.output_preview as string | null) ?? "",
      confidence: (ap.confidence_score as number | null) ?? 0.75,
      urgency,
      status,
      createdAt: ap.created_at as string,
      source: "approvals",
    });
  }

  return NextResponse.json(items);
}
