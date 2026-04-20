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
  /** "approvals" = real DB row that can be PATCHed; "messages" = fallback, localStorage only */
  source: "approvals" | "messages";
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

  // 1. Real approvals from the approvals table
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

  // 2. If no approvals, pull long assistant messages as inbox items
  if (items.length === 0) {
    const { data: messagesData } = await serviceClient
      .from("messages")
      .select(`
        id,
        content,
        created_at,
        conversations!inner(org_id, agent_config_id, agent_configs(role_slug))
      `)
      .eq("conversations.org_id", orgId)
      .eq("role", "assistant")
      .order("created_at", { ascending: false })
      .limit(20);

    for (const msg of messagesData ?? []) {
      const content = (msg.content as string) ?? "";
      if (content.length < 300) continue; // skip short messages

      const convMeta = msg.conversations as {
        org_id?: string;
        agent_config_id?: string;
        agent_configs?: { role_slug?: string } | null;
      } | null;
      const slug = convMeta?.agent_configs?.role_slug;
      const agentSlug =
        slug && validSlugs.includes(slug)
          ? (slug as AgentRoleSlug)
          : ("executive_assistant" as AgentRoleSlug);

      // Build a title from the first line of the content
      const firstLine = content.split("\n")[0].replace(/^#+\s*/, "").slice(0, 80);
      const title = firstLine || "Assistant Draft";

      items.push({
        id: msg.id as string,
        agent: agentSlug,
        title,
        summary: content.slice(0, 150) + (content.length > 150 ? "..." : ""),
        preview: content,
        confidence: 0.8,
        urgency: "normal",
        status: "pending",
        createdAt: msg.created_at as string,
        source: "messages",
      });
    }
  }

  return NextResponse.json(items);
}
