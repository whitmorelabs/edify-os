/**
 * Anthropic Agent Skills registry — maps each archetype slug to the
 * pre-built skills it should have access to.
 *
 * Skills are passed via `container.skills` in `client.beta.messages.create()`.
 * They require:
 *   - beta headers: "code-execution-2025-08-25" + "skills-2025-10-02"
 *   - the code_execution tool in the tools array
 *
 * Adding a skill to an archetype:  add the skill_id to the array below.
 * Available pre-built IDs: "xlsx" | "pptx" | "docx" | "pdf"
 */

import { ARCHETYPE_SLUGS, type ArchetypeSlug } from "@/lib/archetypes";

export type AnthropicSkillId = "xlsx" | "pptx" | "docx" | "pdf";

/** Archetype → skills mapping. */
export const ARCHETYPE_SKILLS: Record<ArchetypeSlug, AnthropicSkillId[]> = {
  executive_assistant: ["docx", "xlsx", "pdf"],
  events_director: ["pptx", "xlsx", "pdf"],
  development_director: ["docx", "xlsx", "pdf"],
  marketing_director: ["pptx", "docx", "pdf"],
  programs_director: ["docx", "xlsx", "pdf"],
  hr_volunteer_coordinator: ["docx", "xlsx", "pdf"],
};

// Exhaust-check: TypeScript errors here if ARCHETYPE_SLUGS drifts from this map.
const _exhaustCheck: Record<ArchetypeSlug, unknown> = ARCHETYPE_SKILLS;
void _exhaustCheck;
void ARCHETYPE_SLUGS; // referenced to keep import live

/**
 * System-prompt addendum injected whenever the archetype has skills.
 * Tells the model to produce real files, not just text.
 */
export const SKILLS_ADDENDUM = `

You have access to file-generation skills for creating Word docs, Excel spreadsheets, PowerPoint presentations, and PDFs. Use them when the user asks for deliverable documents, not just text. For example, a grant proposal should be a .docx the user can download, not just text in chat.
`;

/** Code execution tool definition required alongside skills. */
export const CODE_EXECUTION_TOOL = {
  type: "code_execution_20250825" as const,
  name: "code_execution" as const,
};

/** Beta headers required when using skills. */
export const SKILLS_BETA_HEADERS = [
  "code-execution-2025-08-25",
  "skills-2025-10-02",
] as const;

/** MIME types for skill-generated files, keyed by lowercase extension. */
export const SKILL_MIME: Record<string, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  pdf: "application/pdf",
};

// ---------------------------------------------------------------------------
// C. Skills-on-demand — only attach skills when message suggests doc generation
// ---------------------------------------------------------------------------

const SKILLS_TRIGGER_PATTERNS = [
  /\b(draft|create|generate|build|make|write|produce|compose)\b.*\b(doc|document|deck|slide|presentation|spreadsheet|excel|word|pdf|report|proposal|letter|email|newsletter|memo|policy)\b/i,
  /\bcan you\s+(draft|create|generate|build|make|write|produce|compose)/i,
  /\b(as a |in a )?(\.docx|\.xlsx|\.pptx|\.pdf|google doc|powerpoint|excel)\b/i,
  /\b(put it in|save it as|export as)\b/i,
];

/**
 * Returns true when the user's message suggests a document-generation intent.
 * Used to decide whether to attach skills to the API call.
 */
export function shouldAttachSkills(userMessage: string): boolean {
  return SKILLS_TRIGGER_PATTERNS.some((re) => re.test(userMessage));
}

/**
 * Build the `container` parameter for `client.beta.messages.create()`.
 * Returns undefined when the archetype has no skills (avoids sending empty container).
 */
export function buildContainer(
  skillIds: AnthropicSkillId[]
): { skills: Array<{ type: "anthropic"; skill_id: string; version: string }> } | undefined {
  if (skillIds.length === 0) return undefined;
  return {
    skills: skillIds.map((id) => ({
      type: "anthropic" as const,
      skill_id: id,
      version: "latest",
    })),
  };
}
