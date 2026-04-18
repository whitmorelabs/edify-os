import { NextResponse } from "next/server";
import { google } from "googleapis";
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

  // Build a Calendar client using the access token directly
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: "v3", auth });

  try {
    const response = await calendar.calendarList.list();
    const items = response.data.items ?? [];

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
