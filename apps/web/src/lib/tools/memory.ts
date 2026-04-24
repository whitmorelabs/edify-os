/**
 * Anthropic tool definition and executor for organizational memory.
 * One tool: save_to_memory
 *
 * Reuses the same Supabase insertion path as /api/memory/entries route.ts
 * (POST handler) — no reinvention, just a direct DB call with the same shape.
 */

import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// System-prompt addendum — applied to ALL archetypes
// ---------------------------------------------------------------------------

export const MEMORY_TOOLS_ADDENDUM = `\n## Organizational memory\nWhen the user shares a FACT about the organization (program name, policy, staff member, historical event, values, key partner), call \`save_to_memory\` to persist it. Examples worth saving: "Our CINEMA program serves 40 students", "We do not accept anonymous donations", "Maya is our board chair". Do NOT save chit-chat, temporary context, or the user's personal preferences — only durable organizational facts.`;

// ---------------------------------------------------------------------------
// Valid categories (must match memory_entries table constraint)
// ---------------------------------------------------------------------------

export type MemoryToolCategory =
  | "program"
  | "policy"
  | "person"
  | "values"
  | "other";

/** Maps the simplified tool-facing categories to the DB's MemoryEntryCategory values. */
const CATEGORY_MAP: Record<MemoryToolCategory, string> = {
  program: "programs",
  policy: "processes",
  person: "contacts",
  values: "brand_voice",
  other: "general",
};

// ---------------------------------------------------------------------------
// Tool definition (model-facing)
// ---------------------------------------------------------------------------

export const memoryTools: Anthropic.Tool[] = [
  {
    name: "save_to_memory",
    description:
      "Persist a durable organizational fact to the org's memory bank. Use when the user shares information that should be remembered across all future conversations (program names, policies, key people, org values, partnerships, etc.). Do NOT use for temporary context or personal preferences.",
    input_schema: {
      type: "object" as const,
      properties: {
        key: {
          type: "string",
          description:
            "A short, unique identifier for this fact (e.g. 'program-cinema', 'policy-anonymous-donations', 'person-maya-board-chair'). Use kebab-case.",
        },
        value: {
          type: "string",
          description: "The full fact to remember (1-3 sentences max).",
        },
        category: {
          type: "string",
          enum: ["program", "policy", "person", "values", "other"],
          description:
            "Category: 'program' (a service or initiative), 'policy' (a rule or guideline), 'person' (a staff member, board member, or volunteer), 'values' (org culture, brand voice), 'other'. Defaults to 'other'.",
        },
      },
      required: ["key", "value"],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool executor
// ---------------------------------------------------------------------------

export async function executeMemoryTool({
  name,
  input,
  orgId,
  memberId,
  serviceClient,
}: {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: Record<string, unknown>;
  orgId: string;
  memberId: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: SupabaseClient<any>;
}): Promise<{ content: string; is_error?: boolean }> {
  if (name !== "save_to_memory") {
    return { content: `Unknown memory tool: ${name}`, is_error: true };
  }

  const key = input.key;
  const value = input.value;
  const rawCategory = (input.category as MemoryToolCategory | undefined) ?? "other";

  if (!key || typeof key !== "string" || key.trim().length === 0) {
    return { content: "key is required and must be a non-empty string.", is_error: true };
  }
  if (!value || typeof value !== "string" || value.trim().length === 0) {
    return { content: "value is required and must be a non-empty string.", is_error: true };
  }

  const validCategories: MemoryToolCategory[] = ["program", "policy", "person", "values", "other"];
  const category = validCategories.includes(rawCategory) ? rawCategory : "other";
  const dbCategory = CATEGORY_MAP[category];

  const { error: insertError } = await serviceClient
    .from("memory_entries")
    .insert({
      org_id: orgId,
      category: dbCategory,
      title: (key as string).trim(),
      content: (value as string).trim(),
      source: "archetype_chat",
      created_by: memberId ?? undefined,
      auto_generated: false,
    });

  if (insertError) {
    console.error("[memory-tool] Insert error:", insertError);
    return {
      content: `Failed to save to memory: ${insertError.message}`,
      is_error: true,
    };
  }

  return { content: `Saved to org memory: ${(key as string).trim()}.` };
}
