import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";

/**
 * POST /api/org/create
 *
 * Creates a new org and assigns the calling user as owner.
 * Called from the /onboarding page for brand-new users with no member row.
 *
 * Body: { orgName: string, anthropicKey: string }
 * Returns: { orgId: string, memberId: string }
 */
export async function POST(req: NextRequest) {
  // 1. Verify session — user must be authenticated; member row is NOT required here.
  const { user, memberId } = await getAuthContext();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Reject if user already has a member row (they already onboarded).
  if (memberId) {
    // Look up their org_id for the 409 body.
    const serviceClient = createServiceRoleClient();
    const existing = serviceClient
      ? await serviceClient
          .from("members")
          .select("org_id")
          .eq("user_id", user.id)
          .single()
      : null;
    return NextResponse.json(
      {
        error: "User already belongs to an org",
        orgId: existing?.data?.org_id ?? null,
      },
      { status: 409 }
    );
  }

  // 3. Parse + validate body.
  let body: { orgName?: string; anthropicKey?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const orgName = body.orgName?.trim() ?? "";
  const anthropicKey = body.anthropicKey?.trim() ?? "";

  if (!orgName) {
    return NextResponse.json({ error: "orgName is required" }, { status: 400 });
  }
  if (!anthropicKey) {
    return NextResponse.json({ error: "anthropicKey is required" }, { status: 400 });
  }
  if (!anthropicKey.startsWith("sk-ant-")) {
    return NextResponse.json(
      { error: "Invalid Anthropic API key format (must start with sk-ant-)" },
      { status: 400 }
    );
  }

  // 4. Validate the Anthropic key by making a tiny API call.
  try {
    const anthropic = new Anthropic({ apiKey: anthropicKey });
    await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1,
      messages: [{ role: "user", content: "hi" }],
    });
  } catch (err) {
    const message =
      err instanceof Anthropic.APIError
        ? err.message
        : "Failed to validate Anthropic API key";
    return NextResponse.json(
      { error: `Anthropic key validation failed: ${message}` },
      { status: 400 }
    );
  }

  // 5. Insert org and member rows using the service client.
  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Generate a URL-safe slug from the org name.
  const slug = generateSlug(orgName);

  const { data: org, error: orgError } = await serviceClient
    .from("orgs")
    .insert({
      name: orgName,
      slug,
      anthropic_api_key_encrypted: anthropicKey,
      anthropic_api_key_set_at: new Date().toISOString(),
      anthropic_api_key_valid: true,
      anthropic_api_key_hint: anthropicKey.slice(-4),
    })
    .select("id")
    .single();

  if (orgError || !org) {
    console.error("[api/org/create] Insert org error:", orgError);
    return NextResponse.json(
      { error: orgError?.message ?? "Failed to create org" },
      { status: 500 }
    );
  }

  const { data: member, error: memberError } = await serviceClient
    .from("members")
    .insert({
      org_id: org.id,
      user_id: user.id,
      role: "owner",
    })
    .select("id")
    .single();

  if (memberError || !member) {
    console.error("[api/org/create] Insert member error:", memberError);
    // Attempt cleanup — delete the org we just created to avoid orphaned rows.
    await serviceClient.from("orgs").delete().eq("id", org.id);
    return NextResponse.json(
      { error: memberError?.message ?? "Failed to create member" },
      { status: 500 }
    );
  }

  return NextResponse.json({ orgId: org.id, memberId: member.id }, { status: 201 });
}

/**
 * Converts an org name into a URL-safe slug.
 * Appends a short random suffix to avoid uniqueness collisions.
 * e.g. "Hope Community Foundation" → "hope-community-foundation-a3b2"
 */
function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 45);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}
