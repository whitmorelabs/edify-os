import { NextResponse } from "next/server";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";
import { ARCHETYPE_SLUGS } from "@/lib/archetypes";

/**
 * GET /api/team/last-active
 *
 * Returns a map of { [archetype_slug]: iso_timestamp | null } for the current org.
 * Timestamps come from the most recent conversations.updated_at for each archetype,
 * joined via conversations.agent_config_id → agent_configs.role_slug.
 */
export async function GET() {
  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    // Supabase not configured — return nulls so the client falls back to localStorage
    const empty = Object.fromEntries(ARCHETYPE_SLUGS.map((s) => [s, null]));
    return NextResponse.json(empty);
  }

  // Fetch all conversations for this org with their agent_config role_slug
  const { data, error } = await serviceClient
    .from("conversations")
    .select("updated_at, agent_config_id, agent_configs(role_slug)")
    .eq("org_id", orgId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[team/last-active] DB error:", error);
    return NextResponse.json({ error: "Failed to fetch timestamps" }, { status: 500 });
  }

  // Build a map of slug → most recent updated_at (first occurrence is the max due to ORDER BY DESC)
  const result: Record<string, string | null> = Object.fromEntries(
    ARCHETYPE_SLUGS.map((s) => [s, null])
  );

  for (const row of data ?? []) {
    const slug = (row.agent_configs as { role_slug?: string } | null)?.role_slug;
    if (!slug) continue;
    if (!(ARCHETYPE_SLUGS as readonly string[]).includes(slug)) continue;
    if (result[slug] === null) {
      result[slug] = row.updated_at as string;
    }
  }

  // Fallback: for slugs still null, check tasks table (covers old unlinked conversations)
  const nullSlugs = ARCHETYPE_SLUGS.filter((s) => result[s] === null);
  if (nullSlugs.length > 0) {
    const { data: taskData } = await serviceClient
      .from("tasks")
      .select("agent_role, created_at")
      .in("agent_role", nullSlugs)
      .order("created_at", { ascending: false });

    for (const task of taskData ?? []) {
      const slug = task.agent_role as string;
      if (result[slug] === null) {
        result[slug] = task.created_at as string;
      }
    }
  }

  return NextResponse.json(result);
}
