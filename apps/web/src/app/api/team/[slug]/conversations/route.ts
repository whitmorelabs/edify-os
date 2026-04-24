import { NextResponse } from "next/server";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";
import { ARCHETYPE_SLUGS } from "@/lib/archetypes";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  if (!(ARCHETYPE_SLUGS as readonly string[]).includes(slug)) {
    return NextResponse.json({ error: "Unknown team member" }, { status: 404 });
  }

  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Look up the agent_config_id for this slug so we can filter by it.
  const { data: agentConfig } = await serviceClient
    .from("agent_configs")
    .select("id")
    .eq("org_id", orgId)
    .eq("role_slug", slug)
    .maybeSingle();

  // Fetch conversations for this org filtered by the agent_config for this slug.
  // If no agent_config row exists yet, fall back to all org conversations (degenerate case).
  let query = serviceClient
    .from("conversations")
    .select("id, title, created_at, updated_at")
    .eq("org_id", orgId)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (agentConfig?.id) {
    query = query.eq("agent_config_id", agentConfig.id);
  }

  const { data: conversations, error } = await query;

  if (error) {
    console.error("[team/conversations] DB error:", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }

  return NextResponse.json(conversations ?? []);
}

export async function POST(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  if (!(ARCHETYPE_SLUGS as readonly string[]).includes(slug)) {
    return NextResponse.json({ error: "Unknown team member" }, { status: 404 });
  }

  const { user, orgId, memberId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: newConv, error } = await serviceClient
    .from("conversations")
    .insert({
      org_id: orgId,
      member_id: memberId,
      title: "New conversation",
    })
    .select("id, title, created_at, updated_at")
    .single();

  if (error || !newConv) {
    console.error("[team/conversations] Create error:", error);
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }

  return NextResponse.json(newConv, { status: 201 });
}
