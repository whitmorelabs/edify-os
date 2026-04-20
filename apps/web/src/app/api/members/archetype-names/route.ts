import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";
import { ARCHETYPE_SLUGS } from "@/lib/archetype-config";

/** Shape of the archetype_names JSONB column: slug -> custom name */
export type ArchetypeNamesMap = Partial<Record<string, string>>;

/**
 * GET /api/members/archetype-names
 * Returns the current user's custom archetype names map.
 */
export async function GET() {
  const { user, orgId, memberId } = await getAuthContext();
  if (!user || !orgId || !memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: member, error } = await serviceClient
    .from("members")
    .select("archetype_names")
    .eq("id", memberId)
    .single();

  if (error) {
    console.error("[archetype-names GET] DB error:", error);
    return NextResponse.json({ error: "Failed to fetch archetype names" }, { status: 500 });
  }

  const names: ArchetypeNamesMap = (member?.archetype_names as ArchetypeNamesMap) ?? {};
  return NextResponse.json(names);
}

/**
 * PATCH /api/members/archetype-names
 * Body: { slug: string, name: string | null }
 * Updates a single archetype's custom name. null or empty string clears it.
 * Returns the updated map.
 */
export async function PATCH(req: NextRequest) {
  const { user, orgId, memberId } = await getAuthContext();
  if (!user || !orgId || !memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { slug: string; name: string | null };
  const { slug, name } = body;

  if (!slug || typeof slug !== "string") {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  if (!(ARCHETYPE_SLUGS as readonly string[]).includes(slug)) {
    return NextResponse.json({ error: "Unknown archetype slug" }, { status: 400 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Fetch current names so we can merge
  const { data: member, error: fetchError } = await serviceClient
    .from("members")
    .select("archetype_names")
    .eq("id", memberId)
    .single();

  if (fetchError) {
    console.error("[archetype-names PATCH] Fetch error:", fetchError);
    return NextResponse.json({ error: "Failed to fetch current names" }, { status: 500 });
  }

  const current: ArchetypeNamesMap = (member?.archetype_names as ArchetypeNamesMap) ?? {};

  // Build updated map — delete key if name is null or empty string
  const updated: ArchetypeNamesMap = { ...current };
  const trimmedName = typeof name === "string" ? name.trim() : null;
  if (trimmedName) {
    updated[slug] = trimmedName;
  } else {
    delete updated[slug];
  }

  const { error: updateError } = await serviceClient
    .from("members")
    .update({ archetype_names: updated })
    .eq("id", memberId);

  if (updateError) {
    console.error("[archetype-names PATCH] Update error:", updateError);
    return NextResponse.json({ error: "Failed to update archetype names" }, { status: 500 });
  }

  return NextResponse.json(updated);
}
