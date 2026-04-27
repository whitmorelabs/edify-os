import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";

export interface ImpactDataRow {
  id: string;
  program: string;
  period: string;
  metric_name: string;
  metric_value: number;
  metric_unit: string | null;
  context: string | null;
  source_agent: string | null;
  created_at: string;
}

export async function GET(req: NextRequest) {
  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const program = searchParams.get("program");
  const period = searchParams.get("period");

  let query = serviceClient
    .from("impact_data")
    .select("id, program, period, metric_name, metric_value, metric_unit, context, source_agent, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (program) {
    query = query.ilike("program", `%${program}%`);
  }
  if (period) {
    query = query.ilike("period", `%${period}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[impact-data] Query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also return distinct programs and periods for the UI dropdowns
  const allPrograms = [...new Set((data ?? []).map((d: ImpactDataRow) => d.program))];
  const allPeriods = [...new Set((data ?? []).map((d: ImpactDataRow) => d.period))];

  return NextResponse.json({
    data: data ?? [],
    programs: allPrograms,
    periods: allPeriods,
  });
}
