/**
 * GET /api/ripple/events
 *
 * Returns recent org_events with their ripple_actions for the
 * authenticated user's organization.
 */

import { NextResponse } from "next/server";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";

export interface RippleActionRow {
  id: string;
  target_agent: string;
  action_type: string;
  title: string;
  content: string | null;
  status: string;
  created_at: string;
}

export interface RippleEventRow {
  id: string;
  event_type: string;
  source_agent: string;
  payload: { title: string; details: string };
  processed: boolean;
  created_at: string;
  actions: RippleActionRow[];
}

export async function GET() {
  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  // Fetch events with their actions
  const { data: events, error } = await serviceClient
    .from("org_events")
    .select(
      `
      id,
      event_type,
      source_agent,
      payload,
      processed,
      created_at,
      ripple_actions (
        id,
        target_agent,
        action_type,
        title,
        content,
        status,
        created_at
      )
    `,
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("[ripple/events] DB error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 },
    );
  }

  const shaped: RippleEventRow[] = (events ?? []).map((e) => ({
    id: e.id as string,
    event_type: e.event_type as string,
    source_agent: e.source_agent as string,
    payload: e.payload as { title: string; details: string },
    processed: e.processed as boolean,
    created_at: e.created_at as string,
    actions: ((e.ripple_actions as unknown as RippleActionRow[]) ?? []).map(
      (a) => ({
        id: a.id,
        target_agent: a.target_agent,
        action_type: a.action_type,
        title: a.title,
        content: a.content,
        status: a.status,
        created_at: a.created_at,
      }),
    ),
  }));

  return NextResponse.json(shaped);
}
