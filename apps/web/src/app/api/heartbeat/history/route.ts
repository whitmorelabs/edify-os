import { NextResponse } from "next/server";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const archetype = searchParams.get("archetype");

  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Get heartbeat jobs for this org (filtered by archetype if specified)
  let jobQuery = serviceClient
    .from("heartbeat_jobs")
    .select("id, config")
    .eq("org_id", orgId);

  if (archetype) {
    jobQuery = jobQuery.contains("config", { archetype });
  }

  const { data: jobs } = await jobQuery;

  if (!jobs || jobs.length === 0) {
    return NextResponse.json([]);
  }

  const jobIds = jobs.map((j) => j.id);
  const jobArchetypeMap = Object.fromEntries(
    jobs.map((j) => [j.id, (j.config as { archetype?: string })?.archetype ?? "unknown"])
  );

  // Fetch run history for these jobs
  const { data: runs, error } = await serviceClient
    .from("heartbeat_runs")
    .select("id, job_id, status, findings_summary, started_at, completed_at")
    .in("job_id", jobIds)
    .order("started_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[heartbeat/history] DB error:", error);
    return NextResponse.json({ error: "Failed to fetch heartbeat history" }, { status: 500 });
  }

  // Shape into the format the frontend expects
  const results = (runs ?? []).map((run) => ({
    id: run.id,
    archetype: jobArchetypeMap[run.job_id],
    timestamp: run.started_at,
    status: run.status,
    title: run.findings_summary ? run.findings_summary.split("\n")[0] : null,
    body: run.findings_summary ?? null,
    suggestedAction: null,
  }));

  return NextResponse.json(results);
}
