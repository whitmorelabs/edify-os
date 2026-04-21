import { NextResponse } from "next/server";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";
import type { AgentRoleSlug } from "@/lib/agent-colors";
import { ARCHETYPE_SLUGS } from "@/lib/archetypes";

export type TaskStatus =
  | "pending"
  | "planning"
  | "executing"
  | "awaiting_approval"
  | "completed"
  | "failed";

export interface TaskRow {
  id: string;
  title: string;
  agent: AgentRoleSlug;
  status: TaskStatus;
  /** Artifact type label — "chat_reply", "email_draft", "social_post", etc. Null for legacy rows. */
  kind: string | null;
  /** Short preview of the artifact output (first ~400 chars). Null if unavailable. */
  preview: string | null;
  confidence: number | null;
  createdAt: string;
  steps: {
    id: string;
    stepNumber: number;
    agentRole: string;
    action: string;
    durationMs: number | null;
  }[];
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

  function resolveAgentSlug(roleSlug: string | undefined | null): AgentRoleSlug {
    return roleSlug && validSlugs.includes(roleSlug)
      ? (roleSlug as AgentRoleSlug)
      : "executive_assistant";
  }

  // Pull tasks with their agent config and steps. As of migration 00019, the
  // tasks table carries kind/preview/agent_role for completed chat artifacts
  // (drafted emails, social posts, chat replies) that do NOT require approval.
  // Agent-role resolution prefers tasks.agent_role (set by the chat route),
  // falling back to agent_configs.role_slug for legacy rows.
  const { data: tasksData } = await serviceClient
    .from("tasks")
    .select(`
      id,
      title,
      status,
      kind,
      preview,
      agent_role,
      confidence_score,
      created_at,
      agent_config_id,
      agent_configs(role_slug),
      task_steps(id, step_number, agent_role, action, duration_ms)
    `)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(50);

  // Fallback: if the tasks table is still empty for this org, surface recent
  // conversations as pseudo-completed tasks so the page isn't a ghost town
  // on a fresh install. Once real chat-artifact tasks start flowing in, this
  // fallback goes dormant automatically.
  let conversationTasks: TaskRow[] = [];
  if (!tasksData || tasksData.length === 0) {
    const { data: convData } = await serviceClient
      .from("conversations")
      .select("id, title, updated_at, agent_config_id, agent_configs(role_slug)")
      .eq("org_id", orgId)
      .order("updated_at", { ascending: false })
      .limit(25);

    for (const conv of convData ?? []) {
      const agentSlug = resolveAgentSlug(
        (conv.agent_configs as { role_slug?: string } | null)?.role_slug,
      );

      conversationTasks.push({
        id: conv.id as string,
        title: (conv.title as string | null) ?? "Conversation",
        agent: agentSlug,
        status: "completed",
        kind: null,
        preview: null,
        confidence: null,
        createdAt: conv.updated_at as string,
        steps: [],
      });
    }
  }

  const rows: TaskRow[] = [];

  for (const task of tasksData ?? []) {
    const directRole = task.agent_role as string | null;
    const configRole = (task.agent_configs as { role_slug?: string } | null)?.role_slug ?? null;
    const agentSlug = resolveAgentSlug(directRole ?? configRole);

    const rawStatus = task.status as string;
    const validStatuses: TaskStatus[] = [
      "pending", "planning", "executing", "awaiting_approval", "completed", "failed",
    ];
    const status: TaskStatus = validStatuses.includes(rawStatus as TaskStatus)
      ? (rawStatus as TaskStatus)
      : "pending";

    const rawSteps = (task.task_steps ?? []) as {
      id: string;
      step_number: number;
      agent_role: string;
      action: string;
      duration_ms: number | null;
    }[];

    const steps = rawSteps
      .sort((a, b) => a.step_number - b.step_number)
      .map((s) => ({
        id: s.id,
        stepNumber: s.step_number,
        agentRole: s.agent_role,
        action: s.action,
        durationMs: s.duration_ms,
      }));

    rows.push({
      id: task.id as string,
      title: (task.title as string) || "Untitled Task",
      agent: agentSlug,
      status,
      kind: (task.kind as string | null) ?? null,
      preview: (task.preview as string | null) ?? null,
      confidence: (task.confidence_score as number | null) ?? null,
      createdAt: task.created_at as string,
      steps,
    });
  }

  const result = rows.length > 0 ? rows : conversationTasks;
  return NextResponse.json(result);
}
