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
 *
 * ---
 *
 * Frontend Design skill (Marketing Director only):
 * The open-source `frontend-design` skill from anthropics/skills is a
 * *design reasoning* skill — not a document generator. It is NOT in the
 * pre-built skill_id list (which is just docx/xlsx/pptx/pdf), and Anthropic's
 * API only accepts those pre-built IDs in `container.skills[].skill_id`.
 * So we integrate it as a system-prompt augmentation instead: when the user
 * message shows design intent ("mockup / UI / layout / landing page / etc.")
 * we append FRONTEND_DESIGN_ADDENDUM to the system prompt. No code execution,
 * no beta headers, no container — this is a pure prompt-engineering skill.
 * Source: https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md
 */

import { ARCHETYPE_SLUGS, type ArchetypeSlug } from "@/lib/archetypes";

export type AnthropicSkillId = "xlsx" | "pptx" | "docx" | "pdf";

/**
 * Archetype → eligible skills (full list of formats each archetype CAN use).
 * At runtime, only 1 skill is attached per API call based on user message intent.
 * Anthropic API expands each pre-built skill into ~5 internal sub-components,
 * so the 8-item limit only allows 1 skill per call.
 */
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

/**
 * Beta headers required when using skills.
 * Includes files-api-2025-04-14 since skill execution may return file outputs
 * retrieved via anthropic.beta.files.retrieveMetadata().
 */
export const SKILLS_BETA_HEADERS = [
  "code-execution-2025-08-25",
  "skills-2025-10-02",
  "files-api-2025-04-14",
] as const;

/**
 * MIME types for files served via /api/files/[fileId], keyed by lowercase extension.
 * Covers both Anthropic Skill outputs (docx/xlsx/pptx/pdf) and tool outputs that
 * upload to the same Anthropic Files store (png/jpg from render_design_to_image).
 */
export const SKILL_MIME: Record<string, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
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

/** Format detection patterns -- matched against user message to pick the right skill. */
const FORMAT_PATTERNS: { skill: AnthropicSkillId; patterns: RegExp[] }[] = [
  {
    skill: "xlsx",
    patterns: [
      /\b(spreadsheet|excel|xlsx|\.xlsx|workbook|csv)\b/i,
      /\b(budget|financ|ledger|invoice|expense|revenue|forecast|tracker|tracking)\b.*\b(sheet|table|report)\b/i,
    ],
  },
  {
    skill: "pptx",
    patterns: [
      /\b(presentation|powerpoint|pptx|\.pptx|slide|slides|deck)\b/i,
      /\b(pitch deck|board presentation|keynote)\b/i,
    ],
  },
  {
    skill: "pdf",
    patterns: [
      /\b(pdf|\.pdf)\b/i,
      /\b(as a pdf|save.*pdf|export.*pdf|convert.*pdf)\b/i,
    ],
  },
  {
    skill: "docx",
    patterns: [
      /\b(doc|document|docx|\.docx|word|letter|memo|proposal|report|policy|newsletter|grant)\b/i,
    ],
  },
];

/**
 * Detect the single best skill to attach based on the user's message.
 * Returns the most relevant format from the archetype's eligible skills,
 * or the archetype's first skill as fallback.
 */
export function detectSkillForMessage(
  userMessage: string,
  eligibleSkills: AnthropicSkillId[]
): AnthropicSkillId {
  for (const { skill, patterns } of FORMAT_PATTERNS) {
    if (!eligibleSkills.includes(skill)) continue;
    if (patterns.some((re) => re.test(userMessage))) return skill;
  }
  // Fallback: first eligible skill (docx or pptx depending on archetype)
  return eligibleSkills[0];
}

/**
 * Build the `container` parameter for `client.beta.messages.create()`.
 * Always sends exactly 1 skill to stay under the API's 8-item expansion limit.
 * Returns undefined when no skills provided.
 */
export function buildContainer(
  skillIds: AnthropicSkillId[]
): { skills: Array<{ type: "anthropic"; skill_id: string; version: string }> } | undefined {
  if (skillIds.length === 0) return undefined;
  // Only 1 skill per call -- API expands each into ~5 sub-components
  const selected = skillIds.slice(0, 1);
  return {
    skills: selected.map((id) => ({
      type: "anthropic" as const,
      skill_id: id,
      version: "latest",
    })),
  };
}

// ---------------------------------------------------------------------------
// D. Frontend Design skill — Marketing Director only
// ---------------------------------------------------------------------------

/**
 * Archetypes that get the Frontend Design system-prompt addendum when the
 * user shows design intent. Marketing Director only, for now.
 */
export const FRONTEND_DESIGN_ARCHETYPES: ReadonlySet<ArchetypeSlug> = new Set<ArchetypeSlug>([
  "marketing_director",
]);

/**
 * Design-intent trigger patterns. Matched against the user message to decide
 * whether to inject the Frontend Design addendum for an eligible archetype.
 *
 * Social content series patterns are included because Marketing Director uses
 * render_design_to_image for every multi-post request — the Frontend Design
 * addendum provides the HTML composition guidance for those graphics.
 */
const FRONTEND_DESIGN_TRIGGER_PATTERNS: RegExp[] = [
  /\b(design|designs|designed|designing)\b/i,
  /\b(mock ?up|mockups?|wireframes?|prototype)\b/i,
  /\bui\b|\bux\b|\buser interface\b|\buser experience\b/i,
  /\b(layout|layouts|composition)\b/i,
  /\b(component|components)\b/i,
  /\b(landing page|landing pages|home page|homepage|splash page)\b/i,
  /\b(brand|branding|visual identity|look and feel|aesthetic|aesthetics)\b/i,
  /\b(hero section|hero banner|cta section)\b/i,
  /\b(website|web page|webpage|site|microsite)\b/i,
  /\b(html|css|tailwind|react component|jsx|tsx)\b/i,
  /\b(palette|color scheme|typography|font pairing)\b/i,
  // Social content series — triggers design guidance for render_design_to_image graphics
  /\b(social\s+media\s+series|social\s+series|content\s+series)\b/i,
  /\b(create|draft|design|make|build|generate)\b.{0,30}\b(\d+|a\s+series\s+of|multiple|three|two|four|five)\b.{0,20}\b(posts?|graphics?|images?|cards?)\b/i,
  /\b(draft|design|create|make)\b.{0,20}\bposts?\b/i,
  /\b(instagram|linkedin|facebook|twitter|tiktok)\b.{0,30}\b(post|graphic|card|image|banner|flyer)\b/i,
  /\bsocial\s+(post|graphic|content|card|image)\b/i,
  /\b(event\s+flyer|flyer|poster|banner)\b/i,
];

/**
 * Returns true when the user's message suggests design/frontend intent.
 * Used to decide whether to attach the Frontend Design addendum.
 */
export function shouldAttachFrontendDesign(userMessage: string): boolean {
  return FRONTEND_DESIGN_TRIGGER_PATTERNS.some((re) => re.test(userMessage));
}

/**
 * Frontend Design skill body — mirrors SKILL.md from
 * anthropics/skills/skills/frontend-design/SKILL.md (Anthropic, Apache 2.0).
 * Injected as a system-prompt addendum, not sent via the skills beta API,
 * because the API's `skill_id` enum is limited to docx/xlsx/pptx/pdf.
 */
export const FRONTEND_DESIGN_ADDENDUM = `

## Frontend Design Skill (active for this turn)

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

### Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

### Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

Remember: you are capable of extraordinary creative work. Don't hold back — show what can truly be created when thinking outside the box and committing fully to a distinctive vision.
`;
