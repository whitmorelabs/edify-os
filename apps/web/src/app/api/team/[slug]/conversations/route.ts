import { NextResponse } from "next/server";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";

const VALID_SLUGS = [
  "development_director",
  "marketing_director",
  "executive_assistant",
  "programs_director",
  "hr_volunteer_coordinator",
  "events_director",
];

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  if (!VALID_SLUGS.includes(slug)) {
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

  // Fetch conversations for this org and archetype slug
  // We match by the slug stored in agent_configs, but conversations may not always
  // have an agent_config_id set. For now, return all conversations for this org
  // and filter by a slug tag stored in metadata.
  const { data: conversations, error } = await serviceClient
    .from("conversations")
    .select("id, title, created_at, updated_at")
    .eq("org_id", orgId)
    .order("updated_at", { ascending: false })
    .limit(50);

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

  if (!VALID_SLUGS.includes(slug)) {
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
