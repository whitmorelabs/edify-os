/**
 * GET /api/stats/hours-saved
 *
 * Returns the org's lifetime hours-saved total computed from activity_events.
 * Computation happens at read time: count × minutesSaved(event_key) / 60.
 * This lets us tune estimate values without a data migration.
 *
 * Cache: revalidate every 60s (Next.js fetch cache via next.revalidate).
 * Auth: user must be a member of the org being queried.
 */

import { NextResponse } from "next/server";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";
import { minutesSaved } from "@/lib/hours-saved/estimates";

export const revalidate = 60; // cache for 60s per org

export interface HoursSavedBreakdownItem {
  event_key: string;
  count: number;
  minutes: number;
}

export interface HoursSavedResponse {
  hours_saved_total: number;
  breakdown: HoursSavedBreakdownItem[];
  first_event_at: string | null;
}

export async function GET() {
  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Aggregate counts per event_key for this org.
  // Supabase doesn't expose GROUP BY directly via the JS client, so we
  // select all rows and aggregate in JS. For orgs with very high volume
  // this is a candidate for a DB-level RPC — but at current scale JS
  // aggregation is fine and keeps the migration footprint minimal.
  const { data: rows, error } = await serviceClient
    .from("activity_events")
    .select("event_key, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[stats/hours-saved] query failed", error);
    return NextResponse.json({ error: "Database query failed" }, { status: 500 });
  }

  if (!rows || rows.length === 0) {
    const result: HoursSavedResponse = {
      hours_saved_total: 0,
      breakdown: [],
      first_event_at: null,
    };
    return NextResponse.json(result);
  }

  // Aggregate counts by event_key
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = row.event_key as string;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  // Build breakdown and sum total minutes
  const breakdown: HoursSavedBreakdownItem[] = [];
  let totalMinutes = 0;
  for (const [event_key, count] of counts.entries()) {
    const mins = minutesSaved(event_key);
    const minutes = mins * count;
    totalMinutes += minutes;
    breakdown.push({ event_key, count, minutes });
  }

  // Sort breakdown by minutes descending (most impactful events first)
  breakdown.sort((a, b) => b.minutes - a.minutes);

  const result: HoursSavedResponse = {
    hours_saved_total: totalMinutes / 60,
    breakdown,
    first_event_at: (rows[0].created_at as string) ?? null,
  };

  return NextResponse.json(result);
}
