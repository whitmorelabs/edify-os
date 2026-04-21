import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServiceRoleClient, getAuthContext, buildAnthropicKeyPayload } from "@/lib/supabase/server";
import { ANTHROPIC_KEY_PREFIX } from "@/lib/anthropic";

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
  const { user, memberId, orgId: existingOrgId } = await getAuthContext();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Reject if user already has a member row (they already onboarded).
  // getAuthContext already returned orgId — use it directly, no second query needed.
  if (memberId) {
    return NextResponse.json(
      { error: "User already belongs to an org", orgId: existingOrgId },
      { status: 409 }
    );
  }

  // 3. Parse + validate body.
  let body: { orgName?: string; anthropicKey?: string; timezone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const orgName = body.orgName?.trim() ?? "";
  const anthropicKey = body.anthropicKey?.trim() ?? "";
  const timezone = body.timezone?.trim() || "America/New_York";

  if (!orgName) {
    return NextResponse.json({ error: "orgName is required" }, { status: 400 });
  }
  if (orgName.length > 100) {
    return NextResponse.json(
      { error: "Organization name must be 100 characters or fewer." },
      { status: 400 }
    );
  }
  if (!anthropicKey) {
    return NextResponse.json({ error: "anthropicKey is required" }, { status: 400 });
  }
  if (!anthropicKey.startsWith(ANTHROPIC_KEY_PREFIX)) {
    return NextResponse.json(
      { error: "Invalid Anthropic API key format (must start with sk-ant-)" },
      { status: 400 }
    );
  }

  // 4. Validate the Anthropic key via the free /v1/models endpoint (no tokens consumed).
  try {
    const anthropic = new Anthropic({ apiKey: anthropicKey });
    await anthropic.models.list();
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      if (err.status === 401) {
        return NextResponse.json(
          { error: "Anthropic API key is invalid. Please double-check the key and try again." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Could not validate Anthropic API key right now. Please try again in a moment." },
        { status: 400 }
      );
    }
    console.error("[api/org/create] Unexpected error validating Anthropic key:", err);
    return NextResponse.json(
      { error: "Unexpected error validating Anthropic API key." },
      { status: 400 }
    );
  }

  // 5. Insert org and member rows using the service client.
  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Generate a URL-safe slug from the org name. Retry once on unique collision (23505).
  let slug = generateSlug(orgName);

  const insertOrg = async (slugAttempt: string) =>
    serviceClient
      .from("orgs")
      .insert({ name: orgName, slug: slugAttempt, timezone, ...buildAnthropicKeyPayload(anthropicKey, true) })
      .select("id")
      .single();

  let orgResult = await insertOrg(slug);

  if (orgResult.error?.code === "23505") {
    // Unique slug collision — retry once with a fresh suffix.
    slug = generateSlug(orgName);
    orgResult = await insertOrg(slug);
    if (orgResult.error) {
      console.error("[api/org/create] Insert org error (retry):", orgResult.error);
      return NextResponse.json({ error: "Failed to create org" }, { status: 500 });
    }
  } else if (orgResult.error || !orgResult.data) {
    console.error("[api/org/create] Insert org error:", orgResult.error);
    return NextResponse.json(
      { error: orgResult.error?.message ?? "Failed to create org" },
      { status: 500 }
    );
  }

  const org = orgResult.data;

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
    const { error: deleteError } = await serviceClient
      .from("orgs")
      .delete()
      .eq("id", org.id);
    if (deleteError) {
      console.error("[api/org/create] Org rollback failed", { orgId: org.id, deleteError });
    }
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
