import { NextResponse } from "next/server";
import { getAuthContext, createServiceRoleClient } from "@/lib/supabase/server";
import { getValidGoogleAccessToken } from "@/lib/google";
import { listEvents, type CalendarEvent } from "@/lib/google-calendar";

export type TodayEventsResponse = {
  connected: boolean;
  /** Set when connected but there's a token/auth problem */
  authError?: boolean;
  events: {
    id: string;
    summary: string;
    startTime: string | null;
    endTime: string | null;
    allDay: boolean;
    location?: string;
  }[];
};

/** GET /api/integrations/google/today-events — fetch today's calendar events */
export async function GET() {
  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Check if the integration row exists at all first (to distinguish
  // "not connected" from "connected but token expired/broken").
  const { data: integrationRow } = await serviceClient
    .from("integrations")
    .select("status")
    .eq("org_id", orgId)
    .eq("type", "google_calendar")
    .maybeSingle();

  const isConnected = integrationRow?.status === "active";

  const tokenResult = await getValidGoogleAccessToken(
    serviceClient,
    orgId,
    "google_calendar"
  );

  if ("error" in tokenResult) {
    // Return connected=true + authError=true so the UI can tell the user to
    // reconnect rather than falsely implying they never connected at all.
    return NextResponse.json({
      connected: isConnected,
      authError: isConnected,
      events: [],
    } satisfies TodayEventsResponse);
  }

  const { accessToken } = tokenResult;

  try {
    // Build today's time window in UTC
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const { events } = await listEvents({
      accessToken,
      calendarId: "primary",
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      maxResults: 10,
    });

    const shaped = events.map((e: CalendarEvent) => ({
      id: e.id,
      summary: e.summary ?? "Untitled event",
      startTime: e.start.dateTime ?? null,
      endTime: e.end.dateTime ?? null,
      allDay: !e.start.dateTime,
      location: e.location,
    }));

    return NextResponse.json({
      connected: true,
      events: shaped,
    } satisfies TodayEventsResponse);
  } catch (err) {
    console.error("[today-events] Calendar API error:", err);
    return NextResponse.json({ connected: true, events: [] } satisfies TodayEventsResponse);
  }
}
