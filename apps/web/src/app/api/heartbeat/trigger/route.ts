import { NextResponse } from "next/server";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";
import { getAnthropicClientForOrg } from "@/lib/anthropic";
import { ARCHETYPE_SLUGS, type ArchetypeSlug } from "@/lib/archetypes";
import { ARCHETYPE_HEARTBEAT_PROMPTS } from "@/lib/heartbeat-prompts";
import { runArchetypeTurn } from "@/lib/chat/run-archetype-turn";
import type { HeartbeatResult } from "@/app/dashboard/inbox/heartbeats";
import { insertActivityEvent } from "@/lib/hours-saved/insert-event";
import { claimCronRun } from "@/lib/cron-idempotency";

// Give Vercel enough runway for a full tool-use loop (up to 8 rounds).
// A heartbeat with tool calls can take 30-50s; the default 10s limit would cut it off.
export const maxDuration = 60;

export async function POST(request: Request) {
  const { user, orgId, memberId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

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

  // Idempotency guard (migration 00033): a frozen legacy Vercel project
  // shares this Supabase backend and fires the same cron path against it.
  // If we already ran heartbeat for (archetype, org) today, short-circuit
  // before doing any LLM work. See lib/cron-idempotency.ts.
  const claimed = await claimCronRun(
    serviceClient,
    `heartbeat_trigger:${archetype}`,
    orgId
  );
  if (!claimed) {
    return NextResponse.json(
      {
        skipped: true,
        reason: "already_ran_today",
        archetype,
      },
      { status: 200 }
    );
  }

  const anthropicResult = await getAnthropicClientForOrg(serviceClient, orgId, ["mission", "timezone"]);
  if ("error" in anthropicResult) return anthropicResult.error;
  const { client: anthropic, orgName, org } = anthropicResult;
  const mission = org.mission as string | null;
  const orgTimezone = (org.timezone as string | null) ?? "America/New_York";

  // Upsert heartbeat_jobs row for (org, archetype) so a job record always exists
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

  const jobId = jobRow.id;

  // Insert a heartbeat_runs row with status="running". Also prefetch the custom
  // archetype name in parallel since it doesn't depend on the run row.
  const startedAt = new Date().toISOString();
  const [runResult, memberResult] = await Promise.all([
    serviceClient
      .from("heartbeat_runs")
      .insert({
        job_id: jobId,
        status: "running",
        started_at: startedAt,
        findings_summary: null,
        completed_at: null,
      })
      .select("id")
      .single(),
    memberId
      ? serviceClient.from("members").select("archetype_names").eq("id", memberId).single()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const { data: runRow, error: insertError } = runResult;
  if (insertError || !runRow) {
    console.error("[heartbeat/trigger] Failed to insert heartbeat_runs:", insertError);
    return NextResponse.json({ error: "Failed to start heartbeat run" }, { status: 500 });
  }

  const runId = runRow.id;
  const namesMap = (memberResult.data?.archetype_names as Record<string, string>) ?? {};
  const customArchetypeName = namesMap[archetype] ?? null;

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
      timezone: orgTimezone,
      customArchetypeName,
      model: "haiku", // B. Haiku routing — heartbeats are simple summaries, 5× cheaper
    });
    finalText = text;
    // Fire-and-forget: track the completed heartbeat check-in for hours-saved counter.
    void insertActivityEvent(serviceClient, {
      orgId,
      eventKey: "heartbeat:daily_brief",
      archetypeSlug: archetype,
      userId: memberId,
    });
  } catch (err) {
    console.error("[heartbeat/trigger] runArchetypeTurn failed:", err);
    finalText = err instanceof Error ? err.message : "An unexpected error occurred during the check-in.";
    runStatus = "error";
  }

  const completedAt = new Date().toISOString();
  await Promise.all([
    serviceClient
      .from("heartbeat_runs")
      .update({ status: runStatus, findings_summary: finalText, completed_at: completedAt })
      .eq("id", runId),
    serviceClient
      .from("heartbeat_jobs")
      .update({ last_run_at: completedAt })
      .eq("id", jobId),
  ]);

  // Fire-and-forget: create a notification for the heartbeat check-in.
  const archetypeName = customArchetypeName ?? archetype.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  try {
    serviceClient.from("notifications").insert({
      org_id: orgId,
      type: "checkin",
      title: `${archetypeName} check-in`,
      body: finalText.substring(0, 200) + (finalText.length > 200 ? "..." : ""),
      archetype: archetype,
      link: `/dashboard/team/${archetype}`,
    }).then(({ error }) => {
      if (error) console.error("[heartbeat/trigger] notification insert failed:", error);
    });
  } catch (err) {
    console.error("[heartbeat/trigger] notification insert failed:", err);
  }

  // Title = first non-empty line of the findings text (strips markdown headers, etc.)
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
