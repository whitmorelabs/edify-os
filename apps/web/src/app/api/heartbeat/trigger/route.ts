import { NextResponse } from "next/server";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";
import { getAnthropicClientForOrg } from "@/lib/anthropic";
import { ARCHETYPE_SLUGS, type ArchetypeSlug } from "@/lib/archetypes";
import { ARCHETYPE_HEARTBEAT_PROMPTS } from "@/lib/heartbeat-prompts";
import { runArchetypeTurn } from "@/lib/chat/run-archetype-turn";
import type { HeartbeatResult } from "@/app/dashboard/inbox/heartbeats";

// Give Vercel enough runway for a full tool-use loop (up to 8 rounds).
// A heartbeat with tool calls can take 30-50s; the default 10s limit would cut it off.
export const maxDuration = 60;

export async function POST(request: Request) {
  // 1. Auth check
  const { user, orgId, memberId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // 2. Parse + validate request body
  let archetype: ArchetypeSlug;
  try {
    const body = await request.json();
    const slug = body?.archetype as string | undefined;
    if (!slug || !(ARCHETYPE_SLUGS as readonly string[]).includes(slug)) {
      return NextResponse.json(
        { error: "archetype is required and must be a valid archetype slug" },
        { status: 400 }
      );
    }
    archetype = slug as ArchetypeSlug;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // 3. Get org's Anthropic client (BYOK)
  const anthropicResult = await getAnthropicClientForOrg(serviceClient, orgId, ["mission"]);
  if ("error" in anthropicResult) return anthropicResult.error;
  const { client: anthropic, orgName, org } = anthropicResult;
  const mission = org.mission as string | null;

  // 4. Upsert heartbeat_jobs row for (org, archetype) so a job record always exists
  const jobName = `${archetype} heartbeat`;
  const { data: jobRow, error: upsertError } = await serviceClient
    .from("heartbeat_jobs")
    .upsert(
      {
        org_id: orgId,
        name: jobName,
        job_type: "custom",
        cron_expression: "0 8 * * *",
        enabled: false, // manual trigger doesn't flip the scheduled-cron flag
        config: { archetype },
      },
      { onConflict: "org_id,name" }
    )
    .select("id")
    .single();

  if (upsertError || !jobRow) {
    console.error("[heartbeat/trigger] Failed to upsert heartbeat_jobs:", upsertError);
    return NextResponse.json({ error: "Failed to initialize heartbeat job" }, { status: 500 });
  }

  const jobId: string = jobRow.id;

  // 5. Insert a heartbeat_runs row with status="running"
  const startedAt = new Date().toISOString();
  const { data: runRow, error: insertError } = await serviceClient
    .from("heartbeat_runs")
    .insert({
      job_id: jobId,
      status: "running",
      started_at: startedAt,
      findings_summary: null,
      completed_at: null,
    })
    .select("id")
    .single();

  if (insertError || !runRow) {
    console.error("[heartbeat/trigger] Failed to insert heartbeat_runs:", insertError);
    return NextResponse.json({ error: "Failed to start heartbeat run" }, { status: 500 });
  }

  const runId: string = runRow.id;

  // 6. Fetch optional custom archetype name for this member
  let customArchetypeName: string | null = null;
  if (memberId) {
    const { data: memberRow } = await serviceClient
      .from("members")
      .select("archetype_names")
      .eq("id", memberId)
      .single();
    const namesMap = (memberRow?.archetype_names as Record<string, string>) ?? {};
    customArchetypeName = namesMap[archetype] ?? null;
  }

  // 7. Run the archetype's proactive prompt through the tool-use loop
  const proactivePrompt = ARCHETYPE_HEARTBEAT_PROMPTS[archetype];
  let finalText: string;
  let runStatus: "completed" | "error" = "completed";

  try {
    const { text } = await runArchetypeTurn({
      serviceClient,
      orgId,
      memberId,
      archetype,
      userMessage: proactivePrompt,
      client: anthropic,
      orgName,
      mission,
      history: [],
      customArchetypeName,
    });
    finalText = text;
  } catch (err) {
    console.error("[heartbeat/trigger] runArchetypeTurn failed:", err);
    finalText = err instanceof Error ? err.message : "An unexpected error occurred during the check-in.";
    runStatus = "error";
  }

  // 8. Update heartbeat_runs with result
  const completedAt = new Date().toISOString();
  await serviceClient
    .from("heartbeat_runs")
    .update({
      status: runStatus,
      findings_summary: finalText,
      completed_at: completedAt,
    })
    .eq("id", runId);

  // Also update last_run_at on the job
  await serviceClient
    .from("heartbeat_jobs")
    .update({ last_run_at: completedAt })
    .eq("id", jobId);

  // 9. Shape the HeartbeatResult response
  // Title = first non-empty line of the findings text
  const firstLine =
    finalText
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.length > 0) ?? "Check-in complete";

  const result: HeartbeatResult = {
    id: runId,
    archetype,
    timestamp: startedAt,
    status: runStatus,
    title: firstLine,
    body: finalText,
    suggestedAction: null,
  };

  return NextResponse.json(result);
}
