import { NextResponse } from "next/server";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";
import { getAnthropicClientForOrg } from "@/lib/anthropic";
import { generateBriefing } from "@/lib/briefing/generator";

/**
 * POST /api/briefing/generate
 * Generate a morning briefing for the authenticated user's org.
 * Calls all 6 agents in parallel via Haiku, saves result, creates notification.
 */
export async function POST() {
  const { user, orgId, memberId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Get Anthropic client for this org (BYOK)
  const result = await getAnthropicClientForOrg(serviceClient, orgId, ["mission"]);
  if ("error" in result) return result.error;
  const { client, orgName, org } = result;

  // Build org context string for prompts
  const mission = (org["mission"] as string) || "";
  const orgContext = [
    orgName ? `Organization: ${orgName}` : "",
    mission ? `Mission: ${mission}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    // Generate the briefing (all 6 agents in parallel)
    const { briefing, rawResponses } = await generateBriefing(client, orgName, orgContext);
    const today = briefing.date;

    // Upsert into briefings table (one per org per day)
    const { error: upsertError } = await serviceClient
      .from("briefings")
      .upsert(
        {
          org_id: orgId,
          date: today,
          content: briefing,
          raw_responses: rawResponses,
          generated_at: new Date().toISOString(),
        },
        { onConflict: "org_id,date" }
      );

    if (upsertError) {
      console.error("[briefing/generate] Upsert error:", upsertError);
      // Still return the briefing even if DB save fails
    }

    // Create notification for the member
    if (memberId) {
      const { error: notifError } = await serviceClient
        .from("notifications")
        .insert({
          org_id: orgId,
          member_id: memberId,
          type: "briefing",
          title: "Your morning briefing is ready",
          body: `${briefing.priorities.length} priorities, ${briefing.needsInput.length} items need your input`,
          link: "/dashboard/briefing/today",
          read: false,
        });

      if (notifError) {
        console.error("[briefing/generate] Notification error:", notifError);
      }
    }

    return NextResponse.json(briefing);
  } catch (err) {
    console.error("[briefing/generate] Generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate briefing" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/briefing/generate
 * Fetch today's briefing for the authenticated user's org.
 * Returns 404 if no briefing exists yet today.
 */
export async function GET() {
  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await serviceClient
    .from("briefings")
    .select("id, date, content, generated_at")
    .eq("org_id", orgId)
    .eq("date", today)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "No briefing for today" }, { status: 404 });
  }

  return NextResponse.json(data.content);
}
