/**
 * Cross-archetype handoff tool — allows Marketing Director to query
 * other archetypes for context before drafting social content.
 *
 * One tool: request_archetype_context
 *
 * Design notes:
 * - Synchronous by design (no streaming). Returns a short text answer.
 * - Uses Haiku 4.5 for cost control (1200 token cap).
 * - skillsDisabled: the sub-turn must NOT attach file-generation skills
 *   or the beta code-execution headers — this is a pure Q&A fetch.
 * - Only registered on marketing_director; other archetypes don't get it.
 */

import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ARCHETYPE_PROMPTS } from "@/lib/archetype-prompts";
import { ARCHETYPE_LABELS } from "@/lib/archetypes";

// ---------------------------------------------------------------------------
// System-prompt addendum
// ---------------------------------------------------------------------------

export const HANDOFF_TOOLS_ADDENDUM = `
## Cross-team context tool

You have access to \`request_archetype_context\`. Use it to ask another director a factual question before drafting content. For example, before writing gala posts, ask the Events Director for the event date, theme, and sponsor details. The answer comes back as plain text — use it as source material, not as final copy.

Guidelines:
- Ask one focused question per call.
- Prefer this tool over guessing when org-specific details (dates, themes, goals, names) matter.
- You may call it once or twice per user request; don't chain it repeatedly for the same question.
`;

// ---------------------------------------------------------------------------
// Tool definition
// ---------------------------------------------------------------------------

export const handoffTools: Anthropic.Tool[] = [
  {
    name: "request_archetype_context",
    description:
      "Ask another director a factual question to gather context before drafting content. Use this when the user asks you to create social content about an event, program, grant campaign, staffing update, or any topic that another director owns. The target director answers in plain text — you then use their answer as source material for the content you produce.",
    input_schema: {
      type: "object" as const,
      properties: {
        target_archetype: {
          type: "string",
          enum: [
            "executive_assistant",
            "events_director",
            "development_director",
            "programs_director",
            "hr_volunteer_coordinator",
          ],
          description:
            "Which director to consult. Pick the one whose domain covers the topic: events_director for galas/fundraisers/events, development_director for grants/donors/fundraising, programs_director for programs/services/outcomes, hr_volunteer_coordinator for staff/volunteers/hiring, executive_assistant for schedules/priorities/org-wide logistics.",
        },
        question: {
          type: "string",
          description:
            "The specific factual question to ask the other director. Be concise and concrete. Example: 'What is the date, theme, and key sponsor tier for the October gala?'",
        },
      },
      required: ["target_archetype", "question"],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool executor
// ---------------------------------------------------------------------------

export interface ExecuteHandoffToolOptions {
  name: string;
  input: Record<string, unknown>;
  orgId: string;
  orgName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: SupabaseClient<any>;
  anthropic: Anthropic;
}

export async function executeHandoffTool({
  name,
  input,
  orgName,
  anthropic,
}: ExecuteHandoffToolOptions): Promise<{ content: string; is_error?: boolean }> {
  if (name !== "request_archetype_context") {
    return { content: `Unknown handoff tool: ${name}`, is_error: true };
  }

  const targetArchetype = input.target_archetype as string | undefined;
  const question = input.question as string | undefined;

  if (!targetArchetype || !question?.trim()) {
    return {
      content: "request_archetype_context requires both target_archetype and question.",
      is_error: true,
    };
  }

  const basePrompt = ARCHETYPE_PROMPTS[targetArchetype];
  if (!basePrompt) {
    return {
      content: `Unknown target archetype: ${targetArchetype}`,
      is_error: true,
    };
  }

  const systemPrompt = basePrompt.replace(/\{org_name\}/g, orgName);
  const targetLabel =
    ARCHETYPE_LABELS[targetArchetype as keyof typeof ARCHETYPE_LABELS] ?? targetArchetype;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      temperature: 0.2,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: question,
        },
      ],
    });

    const answer = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n\n")
      .trim();

    return {
      content: `[From ${targetLabel}]: ${answer || "No response received."}`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "handoff call failed";
    return {
      content: `Failed to reach ${targetLabel}: ${msg}`,
      is_error: true,
    };
  }
}
