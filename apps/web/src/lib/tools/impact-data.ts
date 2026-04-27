/**
 * Anthropic tool definitions and executors for impact data.
 *
 * Two tools:
 *   - log_impact_data   (Programs Director logs metrics)
 *   - get_impact_data   (ALL agents retrieve metrics)
 *
 * Data lives in the `impact_data` table (see 00024_impact_data.sql).
 */

import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// System-prompt addendum
// ---------------------------------------------------------------------------

export const IMPACT_DATA_TOOLS_ADDENDUM = `\n## Impact data
When writing about program outcomes, check for real impact data using the \`get_impact_data\` tool before using any statistics. Never fabricate program metrics. If no data exists, say so and suggest the Programs Director log the data first.`;

// ---------------------------------------------------------------------------
// Tool definitions (model-facing)
// ---------------------------------------------------------------------------

export const impactDataWriteTools: Anthropic.Tool[] = [
  {
    name: "log_impact_data",
    description:
      "Log program impact data (outcomes, metrics, milestones). Use when the user shares program results, statistics, or performance data.",
    input_schema: {
      type: "object" as const,
      properties: {
        program: {
          type: "string",
          description: "Program name",
        },
        period: {
          type: "string",
          description: "Time period (e.g. Q2 2026, April 2026)",
        },
        metrics: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              value: { type: "number" },
              unit: { type: "string" },
            },
            required: ["name", "value"],
          },
          description: "Array of metrics to log",
        },
        context: {
          type: "string",
          description: "Additional narrative context",
        },
      },
      required: ["program", "period", "metrics"],
    },
  },
];

export const impactDataReadTools: Anthropic.Tool[] = [
  {
    name: "get_impact_data",
    description:
      "Retrieve program impact data. Use when writing grants, creating content, or preparing reports that need real program statistics.",
    input_schema: {
      type: "object" as const,
      properties: {
        program: {
          type: "string",
          description: "Program name (optional -- omit for all programs)",
        },
        period: {
          type: "string",
          description: "Time period (optional -- omit for latest)",
        },
      },
    },
  },
];

/** Combined set for registration in the tool name lookup */
export const impactDataTools: Anthropic.Tool[] = [
  ...impactDataWriteTools,
  ...impactDataReadTools,
];

// ---------------------------------------------------------------------------
// Tool executor
// ---------------------------------------------------------------------------

interface MetricInput {
  name: string;
  value: number;
  unit?: string;
}

export async function executeImpactDataTool({
  name,
  input,
  orgId,
  serviceClient,
  archetypeSlug,
}: {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: Record<string, unknown>;
  orgId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: SupabaseClient<any>;
  archetypeSlug?: string;
}): Promise<{ content: string; is_error?: boolean }> {
  if (name === "log_impact_data") {
    return executeLogImpactData({ input, orgId, serviceClient, archetypeSlug });
  }

  if (name === "get_impact_data") {
    return executeGetImpactData({ input, orgId, serviceClient });
  }

  return { content: `Unknown impact data tool: ${name}`, is_error: true };
}

// ---------------------------------------------------------------------------
// log_impact_data
// ---------------------------------------------------------------------------

async function executeLogImpactData({
  input,
  orgId,
  serviceClient,
  archetypeSlug,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: Record<string, unknown>;
  orgId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: SupabaseClient<any>;
  archetypeSlug?: string;
}): Promise<{ content: string; is_error?: boolean }> {
  const program = input.program as string | undefined;
  const period = input.period as string | undefined;
  const metrics = input.metrics as MetricInput[] | undefined;
  const context = (input.context as string | undefined) ?? null;

  if (!program || !period || !metrics || metrics.length === 0) {
    return {
      content: "program, period, and at least one metric are required.",
      is_error: true,
    };
  }

  const rows = metrics.map((m) => ({
    org_id: orgId,
    program,
    period,
    metric_name: m.name,
    metric_value: m.value,
    metric_unit: m.unit ?? null,
    context,
    source_agent: archetypeSlug ?? null,
  }));

  const { error } = await serviceClient.from("impact_data").insert(rows);

  if (error) {
    console.error("[impact-data] Insert error:", error);
    return {
      content: `Failed to log impact data: ${error.message}`,
      is_error: true,
    };
  }

  const metricSummary = metrics
    .map((m) => `${m.name}: ${m.value}${m.unit ? ` ${m.unit}` : ""}`)
    .join(", ");

  return {
    content: `Logged ${metrics.length} metric(s) for ${program} (${period}): ${metricSummary}.`,
  };
}

// ---------------------------------------------------------------------------
// get_impact_data
// ---------------------------------------------------------------------------

async function executeGetImpactData({
  input,
  orgId,
  serviceClient,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: Record<string, unknown>;
  orgId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: SupabaseClient<any>;
}): Promise<{ content: string; is_error?: boolean }> {
  const program = input.program as string | undefined;
  const period = input.period as string | undefined;

  let query = serviceClient
    .from("impact_data")
    .select("program, period, metric_name, metric_value, metric_unit, context, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (program) {
    query = query.ilike("program", `%${program}%`);
  }
  if (period) {
    query = query.ilike("period", `%${period}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[impact-data] Query error:", error);
    return {
      content: `Failed to retrieve impact data: ${error.message}`,
      is_error: true,
    };
  }

  if (!data || data.length === 0) {
    const filters = [program && `program "${program}"`, period && `period "${period}"`]
      .filter(Boolean)
      .join(", ");
    return {
      content: `No impact data found${filters ? ` for ${filters}` : ""}. The Programs Director can log data using the log_impact_data tool.`,
    };
  }

  // Group metrics by program + period for readable output
  const grouped: Record<string, Array<{ name: string; value: number; unit: string | null; context: string | null }>> = {};
  for (const row of data) {
    const key = `${row.program} | ${row.period}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push({
      name: row.metric_name,
      value: row.metric_value,
      unit: row.metric_unit,
      context: row.context,
    });
  }

  const sections = Object.entries(grouped).map(([key, metrics]) => {
    const lines = metrics.map(
      (m) => `  - ${m.name}: ${m.value}${m.unit ? ` ${m.unit}` : ""}`
    );
    const contextLine = metrics[0]?.context ? `  Context: ${metrics[0].context}` : "";
    return `${key}\n${lines.join("\n")}${contextLine ? `\n${contextLine}` : ""}`;
  });

  return { content: sections.join("\n\n") };
}
