import { NextResponse } from "next/server";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";

// Canonical archetype slugs
const ARCHETYPE_SLUGS = [
  "development_director",
  "marketing_director",
  "executive_assistant",
  "programs_director",
  "hr_volunteer_coordinator",
  "events_director",
] as const;

// Default heartbeat job configs per archetype (used when no DB row exists yet)
const ARCHETYPE_DEFAULTS: Record<string, { frequencyHours: number; activeStart: number; activeEnd: number }> = {
  development_director:   { frequencyHours: 4,  activeStart: 8, activeEnd: 20 },
  marketing_director:     { frequencyHours: 4,  activeStart: 8, activeEnd: 20 },
  executive_assistant:    { frequencyHours: 2,  activeStart: 8, activeEnd: 18 },
  programs_director:      { frequencyHours: 8,  activeStart: 9, activeEnd: 17 },
  hr_volunteer_coordinator: { frequencyHours: 24, activeStart: 9, activeEnd: 17 },
  events_director:        { frequencyHours: 8,  activeStart: 9, activeEnd: 17 },
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

  // Get org timezone
  const { data: org } = await serviceClient
    .from("orgs")
    .select("timezone")
    .eq("id", orgId)
    .single();

  // Get existing heartbeat jobs for this org
  const { data: jobs, error } = await serviceClient
    .from("heartbeat_jobs")
    .select("id, name, job_type, config, enabled, last_run_at")
    .eq("org_id", orgId);

  if (error) {
    console.error("[heartbeat GET] DB error:", error);
    return NextResponse.json({ error: "Failed to fetch heartbeat config" }, { status: 500 });
  }

  // Build response in the shape the frontend expects
  const jobByArchetype = Object.fromEntries(
    (jobs ?? []).map((j) => [j.config?.archetype as string, j])
  );

  const archetypes: Record<string, object> = {};
  for (const slug of ARCHETYPE_SLUGS) {
    const job = jobByArchetype[slug];
    const defaults = ARCHETYPE_DEFAULTS[slug];
    archetypes[slug] = {
      archetype: slug,
      enabled: job?.enabled ?? false,
      frequencyHours: job?.config?.frequencyHours ?? defaults.frequencyHours,
      activeHoursStart: job?.config?.activeStart ?? defaults.activeStart,
      activeHoursEnd: job?.config?.activeEnd ?? defaults.activeEnd,
      lastRunAt: job?.last_run_at ?? null,
    };
  }

  return NextResponse.json({
    enabled: (jobs ?? []).some((j) => j.enabled),
    timezone: org?.timezone ?? "America/New_York",
    emailDigest: false,
    digestTime: "08:00",
    archetypes,
  });
}

export async function PATCH(request: Request) {
  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Handle per-archetype config update
  if (body.archetype && body.config) {
    const slug = body.archetype as string;
    const config = body.config as { enabled?: boolean; frequencyHours?: number; activeHoursStart?: number; activeHoursEnd?: number };

    // Upsert heartbeat job for this archetype
    const { error } = await serviceClient
      .from("heartbeat_jobs")
      .upsert(
        {
          org_id: orgId,
          name: `${slug} heartbeat`,
          job_type: "custom",
          cron_expression: `0 */${config.frequencyHours ?? 4} * * *`,
          enabled: config.enabled ?? false,
          config: {
            archetype: slug,
            frequencyHours: config.frequencyHours ?? 4,
            activeStart: config.activeHoursStart ?? 8,
            activeEnd: config.activeHoursEnd ?? 20,
          },
        },
        { onConflict: "org_id,name" }
      );

    if (error) {
      console.error("[heartbeat PATCH archetype] DB error:", error);
      return NextResponse.json({ error: "Failed to update heartbeat config" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  // Handle org-level settings
  if (body.timezone) {
    await serviceClient
      .from("orgs")
      .update({ timezone: body.timezone })
      .eq("id", orgId);
  }

  return NextResponse.json({ success: true });
}
