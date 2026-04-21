import { NextResponse } from "next/server";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";
import { ARCHETYPE_SLUGS } from "@/lib/archetypes";

/**
 * Defaults mirror /api/admin/ai-config — keep in sync if those change.
 * Used when an org has no agent_configs row for a given archetype yet.
 */
const DEFAULT_ENABLED: Record<string, boolean> = {
  development_director: true,
  marketing_director: true,
  executive_assistant: true,
  programs_director: true,
  hr_volunteer_coordinator: false,
  events_director: true,
};

export type EnabledAgentsMap = Record<string, boolean>;

/**
 * GET /api/team/enabled
 *
 * Returns { [archetype_slug]: enabled } for the caller's org. Reads from
 * agent_configs.enabled, falling back to the default seed for any archetype
 * that doesn't yet have a DB row. Shared between the sidebar and the admin
 * dashboard so both read from the same source of truth.
 */
export async function GET() {
  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    // Supabase not configured — return defaults so the UI still renders sensibly
    const fallback: EnabledAgentsMap = Object.fromEntries(
      ARCHETYPE_SLUGS.map((s) => [s, DEFAULT_ENABLED[s] ?? true])
    );
    return NextResponse.json(fallback);
  }

  const { data, error } = await serviceClient
    .from("agent_configs")
    .select("role_slug, enabled")
    .eq("org_id", orgId);

  if (error) {
    console.error("[team/enabled] DB error:", error);
    return NextResponse.json({ error: "Failed to fetch agent state" }, { status: 500 });
  }

  const bySlug = Object.fromEntries((data ?? []).map((c) => [c.role_slug, c.enabled]));
  const result: EnabledAgentsMap = Object.fromEntries(
    ARCHETYPE_SLUGS.map((slug) => [slug, bySlug[slug] ?? DEFAULT_ENABLED[slug] ?? true])
  );

  return NextResponse.json(result);
}
