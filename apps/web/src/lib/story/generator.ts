/**
 * Story Engine generator -- transforms impact data into formatted narratives.
 *
 * Uses Claude Sonnet for quality generation. Each output format has a
 * tailored system prompt that produces the right tone and structure.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StoryFormat =
  | "grant_narrative"
  | "social_post"
  | "board_table"
  | "donor_email"
  | "annual_report";

export interface StoryRequest {
  program: string;
  period: string;
  format: StoryFormat;
  orgName?: string;
}

export interface StoryResult {
  content: string;
  format: StoryFormat;
  program: string;
  period: string;
}

export interface ImpactMetric {
  metric_name: string;
  metric_value: number;
  metric_unit: string | null;
  context: string | null;
}

// ---------------------------------------------------------------------------
// Format-specific prompts
// ---------------------------------------------------------------------------

const FORMAT_PROMPTS: Record<StoryFormat, string> = {
  grant_narrative: `You are a grant writer for a nonprofit organization. Write a formal, evidence-based narrative section for a grant proposal or funder report.

Requirements:
- Use precise numbers and percentages from the provided data
- Frame outcomes in terms of impact and mission advancement
- Compare to targets where possible
- Use formal but compelling language
- Write 2-3 paragraphs
- Focus on outcomes, not activities
- Never fabricate numbers -- only use what is provided`,

  social_post: `You are a nonprofit communications expert. Write a social media post that is casual, impactful, and shareable.

Requirements:
- Under 280 characters total
- Lead with the most impressive stat
- Make it human and relatable -- not corporate
- Include one clear call-to-action or emotional hook
- No hashtags unless they add value
- Never fabricate numbers -- only use what is provided`,

  board_table: `You are a nonprofit executive assistant preparing materials for a board meeting. Create a structured markdown table showing program metrics.

Requirements:
- Format as a clean markdown table
- Columns: Metric | Value | Unit
- Add a brief 1-2 sentence summary above the table
- Keep it concise and scannable
- Never fabricate numbers -- only use what is provided`,

  donor_email: `You are writing a personal email to a major donor on behalf of a nonprofit executive director. The tone should be warm, personal, and gratitude-centered while sharing real impact.

Requirements:
- Start with genuine gratitude
- Share 2-3 specific outcomes their support made possible
- Use concrete numbers from the data
- Close with forward-looking vision
- Keep it to 150-200 words
- Never fabricate numbers -- only use what is provided`,

  annual_report: `You are writing a section of a nonprofit annual report. Create a polished narrative highlight that celebrates the program's achievements.

Requirements:
- Write 3-4 paragraphs
- Lead with the human impact story, then back it with data
- Use an engaging, celebratory but professional tone
- Include all key metrics woven into the narrative
- End with a forward-looking statement
- Never fabricate numbers -- only use what is provided`,
};

export const FORMAT_LABELS: Record<StoryFormat, string> = {
  grant_narrative: "Grant Narrative",
  social_post: "Social Post",
  board_table: "Board Report",
  donor_email: "Donor Email",
  annual_report: "Annual Report",
};

// ---------------------------------------------------------------------------
// Fetch impact data for a program/period
// ---------------------------------------------------------------------------

async function fetchImpactMetrics(
  serviceClient: SupabaseClient<any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  orgId: string,
  program: string,
  period: string,
): Promise<ImpactMetric[]> {
  const { data, error } = await serviceClient
    .from("impact_data")
    .select("metric_name, metric_value, metric_unit, context")
    .eq("org_id", orgId)
    .ilike("program", `%${program}%`)
    .ilike("period", `%${period}%`)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[story-generator] Error fetching impact data:", error);
    return [];
  }

  return (data ?? []) as ImpactMetric[];
}

// ---------------------------------------------------------------------------
// Generate story content
// ---------------------------------------------------------------------------

export async function generateStory({
  request,
  orgId,
  serviceClient,
  anthropicClient,
}: {
  request: StoryRequest;
  orgId: string;
  serviceClient: SupabaseClient<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  anthropicClient: Anthropic;
}): Promise<StoryResult> {
  const { program, period, format, orgName } = request;

  // Fetch the real data
  const metrics = await fetchImpactMetrics(serviceClient, orgId, program, period);

  if (metrics.length === 0) {
    return {
      content: `No impact data found for "${program}" in period "${period}". Please log program data first using the Programs Director agent.`,
      format,
      program,
      period,
    };
  }

  // Build the data context for the LLM
  const metricLines = metrics.map((m) => {
    const unit = m.metric_unit ? ` (${m.metric_unit})` : "";
    return `- ${m.metric_name}: ${m.metric_value}${unit}`;
  });

  const contextLines = metrics
    .filter((m) => m.context)
    .map((m) => m.context);
  const uniqueContext = [...new Set(contextLines)].join(" ");

  const userMessage = `Organization: ${orgName || "the organization"}
Program: ${program}
Period: ${period}

Impact Data:
${metricLines.join("\n")}
${uniqueContext ? `\nAdditional Context: ${uniqueContext}` : ""}

Generate the ${FORMAT_LABELS[format].toLowerCase()} using this data.`;

  const systemPrompt = FORMAT_PROMPTS[format];

  // Use Sonnet for quality narrative generation
  const response = await anthropicClient.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    temperature: 0.4,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const content =
    response.content[0]?.type === "text"
      ? response.content[0].text
      : "Failed to generate content.";

  return { content, format, program, period };
}
