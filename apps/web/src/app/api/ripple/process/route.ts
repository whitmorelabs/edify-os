/**
 * POST /api/ripple/process
 *
 * Called (fire-and-forget) after a report_event tool fires.
 * Takes an event_id, runs the ripple engine to generate follow-up actions
 * across subscriber agents, and creates a notification for the user.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getAnthropicClientForOrg } from "@/lib/anthropic";
import { processRippleEvent } from "@/lib/ripple/engine";

export async function POST(req: NextRequest) {
  let body: { event_id?: string; org_id?: string };
  try {
    body = (await req.json()) as { event_id?: string; org_id?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event_id, org_id } = body;
  if (!event_id || !org_id) {
    return NextResponse.json(
      { error: "event_id and org_id are required" },
      { status: 400 },
    );
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  // Fetch the event
  const { data: event, error: fetchError } = await serviceClient
    .from("org_events")
    .select("id, org_id, event_type, source_agent, payload")
    .eq("id", event_id)
    .eq("org_id", org_id)
    .single();

  if (fetchError || !event) {
    console.error("[ripple/process] Event not found:", fetchError);
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Get the org's Anthropic client
  const anthropicResult = await getAnthropicClientForOrg(serviceClient, org_id);
  if ("error" in anthropicResult) {
    return anthropicResult.error;
  }
  const { client: anthropicClient } = anthropicResult;

  // Run the ripple engine
  const actions = await processRippleEvent({
    event: {
      id: event.id as string,
      org_id: event.org_id as string,
      event_type: event.event_type as string,
      source_agent: event.source_agent as string,
      payload: event.payload as { title: string; details: string },
    },
    serviceClient,
    anthropicClient,
  });

  // Create a notification for the org members
  if (actions.length > 0) {
    const payload = event.payload as { title: string };

    // Find all members for this org to notify
    const { data: members } = await serviceClient
      .from("members")
      .select("id")
      .eq("org_id", org_id);

    if (members && members.length > 0) {
      const notifications = members.map((m) => ({
        org_id,
        member_id: m.id,
        type: "ripple",
        title: `${actions.length} follow-up action${actions.length === 1 ? "" : "s"} generated`,
        body: `From event: ${payload.title}`,
        link: "/dashboard/ripple",
        read: false,
      }));

      const { error: notifError } = await serviceClient
        .from("notifications")
        .insert(notifications);

      if (notifError) {
        console.error(
          "[ripple/process] Failed to create notifications:",
          notifError,
        );
      }
    }
  }

  return NextResponse.json({
    success: true,
    event_id,
    actions_generated: actions.length,
  });
}
