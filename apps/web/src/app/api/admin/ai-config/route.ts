import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";

const DEFAULT_ARCHETYPES = [
  { role_slug: "development_director", display_name: "Director of Development", enabled: true, autonomy_level: "assisted" },
  { role_slug: "marketing_director", display_name: "Marketing Director", enabled: true, autonomy_level: "suggestion" },
  { role_slug: "executive_assistant", display_name: "Executive Assistant", enabled: true, autonomy_level: "assisted" },
  { role_slug: "programs_director", display_name: "Programs Director", enabled: true, autonomy_level: "suggestion" },
  { role_slug: "hr_volunteer_coordinator", display_name: "HR & Volunteer Coordinator", enabled: false, autonomy_level: "suggestion" },
  { role_slug: "events_director", display_name: "Events Director", enabled: true, autonomy_level: "suggestion" },
];

export async function GET() {
  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Get agent configs for this org
  const { data: configs, error } = await serviceClient
    .from("agent_configs")
    .select("id, role_slug, display_name, enabled, autonomy_level, persona_overrides")
    .eq("org_id", orgId);

  if (error) {
    console.error("[admin/ai-config] DB error:", error);
    return NextResponse.json({ error: "Failed to fetch agent configs" }, { status: 500 });
  }

  // Get org's Claude API key status
  const { data: org } = await serviceClient
    .from("orgs")
    .select("anthropic_api_key_encrypted, anthropic_api_key_set_at, anthropic_api_key_valid")
    .eq("id", orgId)
    .single();

  // Merge DB configs with defaults (use defaults for any archetype not yet in DB)
  const dbBySlug = Object.fromEntries((configs ?? []).map((c) => [c.role_slug, c]));
  const archetypes = DEFAULT_ARCHETYPES.map((def) => {
    const db = dbBySlug[def.role_slug];
    return {
      slug: def.role_slug,
      label: db?.display_name ?? def.display_name,
      enabled: db?.enabled ?? def.enabled,
      autonomyLevel: db?.autonomy_level ?? def.autonomy_level,
      personaOverrides: db?.persona_overrides ? JSON.stringify(db.persona_overrides) : "",
      dbId: db?.id ?? null,
    };
  });

  const hasKey = Boolean(org?.anthropic_api_key_encrypted);
  const provider = {
    provider: "Claude (Anthropic)",
    accessKeySet: hasKey,
    accessKeyPreview: hasKey
      ? `sk-ant-...${org!.anthropic_api_key_encrypted!.slice(-8)}`
      : null,
    keySetAt: org?.anthropic_api_key_set_at ?? null,
    keyValid: org?.anthropic_api_key_valid ?? false,
  };

  return NextResponse.json({ archetypes, provider });
}

export async function PATCH(req: NextRequest) {
  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Handle updating the Claude API key
  if (body.anthropicApiKey !== undefined) {
    const keyValue = body.anthropicApiKey?.trim();
    const { error } = await serviceClient
      .from("orgs")
      .update({
        anthropic_api_key_encrypted: keyValue || null,
        anthropic_api_key_set_at: keyValue ? new Date().toISOString() : null,
        anthropic_api_key_valid: false, // will be validated on first use
      })
      .eq("id", orgId);

    if (error) {
      console.error("[admin/ai-config PATCH key] DB error:", error);
      return NextResponse.json({ error: "Failed to update API key" }, { status: 500 });
    }
    return NextResponse.json({ success: true, updated: "api_key" });
  }

  // Handle updating an archetype config
  const { slug, enabled, autonomyLevel, personaOverrides } = body;

  if (!slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  // Upsert the agent config
  const { error } = await serviceClient
    .from("agent_configs")
    .upsert(
      {
        org_id: orgId,
        role_slug: slug,
        display_name: DEFAULT_ARCHETYPES.find((d) => d.role_slug === slug)?.display_name ?? slug,
        enabled: enabled ?? true,
        autonomy_level: autonomyLevel ?? "suggestion",
        persona_overrides: personaOverrides ? { text: personaOverrides } : {},
      },
      { onConflict: "org_id,role_slug" }
    );

  if (error) {
    console.error("[admin/ai-config PATCH] DB error:", error);
    return NextResponse.json({ error: "Failed to update archetype config" }, { status: 500 });
  }

  return NextResponse.json({ success: true, updated: slug });
}
