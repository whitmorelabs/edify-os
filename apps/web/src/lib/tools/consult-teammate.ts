/**
 * Cross-archetype consultation tool — allows ANY agent to consult another
 * agent mid-conversation for their expertise.
 *
 * Unlike the handoff tool (marketing_director only), this tool is available
 * to ALL archetypes. When called, it loads the target teammate's system
 * prompt and makes a synchronous Haiku call to get a professional response.
 *
 * Design notes:
 * - Synchronous by design (no streaming). Returns a short text answer.
 * - Uses Haiku 4.5 for cost control (1200 token cap).
 * - The calling agent incorporates the response naturally into their reply.
 */

import type Anthropic from "@anthropic-ai/sdk";
import { ARCHETYPE_PROMPTS } from "@/lib/archetype-prompts";
import { ARCHETYPE_LABELS, type ArchetypeSlug } from "@/lib/archetypes";

// ---------------------------------------------------------------------------
// System-prompt addendum
// ---------------------------------------------------------------------------

export const CONSULT_TEAMMATE_TOOLS_ADDENDUM = `
## Teammate consultation tool

You can consult your AI teammates using the \`consult_teammate\` tool. Do this when: (1) a question touches another team member's domain, (2) you need data or expertise outside your role, (3) the user asks something that would benefit from multiple perspectives. When you consult a teammate, naturally incorporate their input into your response -- e.g., "I checked with [Name], our [Role], and they said..."
`;

// ---------------------------------------------------------------------------
// Tool definition
// ---------------------------------------------------------------------------

export const consultTeammateTool: Anthropic.Tool = {
  name: "consult_teammate",
  description:
    "Consult another AI team member for their expertise. Use this when you need input from a colleague's domain -- e.g., ask the Programs Director about program costs, ask HR about staffing, ask Marketing about content strategy. The teammate will respond with their professional perspective.",
  input_schema: {
    type: "object" as const,
    properties: {
      teammate: {
        type: "string",
        enum: [
          "executive_assistant",
          "events_director",
          "development_director",
          "marketing_director",
          "programs_director",
          "hr_volunteer_coordinator",
        ],
        description: "Which team member to consult",
      },
      question: {
        type: "string",
        description:
          "What you want to ask them -- be specific about what information or perspective you need",
      },
    },
    required: ["teammate", "question"],
  },
};

export const consultTeammateTools: Anthropic.Tool[] = [consultTeammateTool];

// ---------------------------------------------------------------------------
// Tool executor
// ---------------------------------------------------------------------------

export interface ExecuteConsultTeammateOptions {
  name: string;
  input: Record<string, unknown>;
  orgName: string;
  sourceArchetype: string;
  anthropic: Anthropic;
}

export async function executeConsultTeammateTool({
  name,
  input,
  orgName,
  sourceArchetype,
  anthropic,
}: ExecuteConsultTeammateOptions): Promise<{ content: string; is_error?: boolean }> {
  if (name !== "consult_teammate") {
    return { content: `Unknown consult-teammate tool: ${name}`, is_error: true };
  }

  const teammate = input.teammate as string | undefined;
  const question = input.question as string | undefined;

  if (!teammate || !question?.trim()) {
    return {
      content: "consult_teammate requires both teammate and question.",
      is_error: true,
    };
  }

  const basePrompt = ARCHETYPE_PROMPTS[teammate];
  if (!basePrompt) {
    return {
      content: `Unknown teammate: ${teammate}`,
      is_error: true,
    };
  }

  const systemPrompt = basePrompt.replace(/\{org_name\}/g, orgName);
  const sourceLabel =
    ARCHETYPE_LABELS[sourceArchetype as ArchetypeSlug] ?? sourceArchetype;
  const teammateLabel =
    ARCHETYPE_LABELS[teammate as ArchetypeSlug] ?? teammate;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      temperature: 0.2,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Your colleague ${sourceLabel} is asking: ${question}. Provide a concise, professional response with specific data if available.`,
        },
      ],
    });

    const answer = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n\n")
      .trim();

    return {
      content: `[From ${teammateLabel}]: ${answer || "No response received."}`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "consultation call failed";
    return {
      content: `Failed to reach ${teammateLabel}: ${msg}`,
      is_error: true,
    };
  }
}
