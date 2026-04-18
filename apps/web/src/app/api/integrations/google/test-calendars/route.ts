import { NextResponse } from "next/server";
import { getAuthContext, createServiceRoleClient } from "@/lib/supabase/server";
import { getValidGoogleAccessToken } from "@/lib/google";

/** GET /api/integrations/google/test-calendars — smoke test: list the org's Google calendars */
export async function GET() {
  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const tokenResult = await getValidGoogleAccessToken(
    serviceClient,
    orgId,
    "google_calendar"
  );

  if ("error" in tokenResult) {
    return tokenResult.error;
  }

  const { accessToken } = tokenResult;

  // Direct REST fetch — avoids importing the 4MB googleapis bundle
  try {
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      console.error("[test-calendars] Calendar API error:", response.status, errBody);
      return NextResponse.json(
        { error: "Failed to fetch calendars from Google" },
        { status: 502 }
      );
    }

    const data = (await response.json()) as {
      items?: { id?: string; summary?: string; primary?: boolean }[];
    };
    const items = data.items ?? [];

    const calendars = items.map((c) => ({
      id: c.id,
      summary: c.summary,
      primary: c.primary ?? false,
    }));

    return NextResponse.json({ calendars });
  } catch (err) {
    console.error("[test-calendars] Calendar API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch calendars from Google" },
      { status: 502 }
    );
  }
}
