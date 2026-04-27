/**
 * Intent detection for dynamic plugin skill selection.
 *
 * The Anthropic Skills API hard-caps container.skills at 8 items. Several
 * archetypes have 9-11 plugin skills. This module powers the two-tier
 * priority strategy:
 *
 *   Tier 1 — Edify-native skills: always pinned to the active set.
 *             These are CLM Studios-authored nonprofit-specific skills
 *             (gala_invite, board_meeting_packet, grant_proposal_writer, etc.)
 *             They are our differentiation and must always be reachable.
 *
 *   Tier 2 — Vendored skills: fill remaining slots (cap - native count)
 *             scored by intent detected from the user's message.
 *             Score 2 = category matched; Score 0 = other category matched
 *             but not this one; Score 1 = no category matched (neutral fallback).
 *
 * See selectSkillsForMessage() in registry.ts for the full selector.
 */

/** Intent categories with regex patterns matched against user messages. */
export const VENDOR_INTENT_PATTERNS: Record<string, RegExp[]> = {
  document: [
    /\b(draft|write|generate|create|prepare)\b.*\b(doc|document|letter|memo|policy|proposal|word)\b/i,
    /\b(spreadsheet|excel|xlsx|workbook|tracker|csv)\b/i,
    /\b(slide|deck|presentation|pptx|powerpoint|keynote)\b/i,
    /\b(announcement|newsletter|update|comm|memo)\b/i,
  ],
  marketing: [
    /\b(post|graphic|social|campaign|brand|design|asset)\b/i,
    /\b(instagram|linkedin|facebook|twitter|tiktok|youtube)\b/i,
    /\b(content|caption|copy|messaging)\b/i,
  ],
  hr: [
    /\b(volunteer|hire|onboard|interview|review|policy|compensation|salary|handbook|recruitment|training)\b/i,
    /\b(staff|employee|team member)\b/i,
  ],
  sales_donor: [
    /\b(donor|funder|foundation|sponsor|grant|prospect|cultivat|pitch|outreach|stewardship)\b/i,
    /\b(call|meeting|cold)\b.*\b(prep|outreach|donor|funder|sponsor)\b/i,
    /\b(account research|funder research)\b/i,
  ],
  operations: [
    /\b(status|update|risk|vendor|process|sop|raci|workflow)\b/i,
    /\b(red.{0,3}yellow.{0,3}green|r.{0,2}y.{0,2}g)\b/i,
  ],
  data: [
    /\b(analy|dashboard|metric|kpi|chart|trend|segment|insight|visualiz)\b/i,
    /\b(donor data|program data|outcome data)\b/i,
  ],
  productivity: [
    /\b(task|todo|action item|to.do|to do)\b/i,
  ],
  events: [
    /\b(event|gala|fundraiser|conference|run.of.show|sponsor|venue|catering)\b/i,
  ],
  programs: [
    /\b(program|outcome|logic model|theory of change|participant|survey|impact|measurement|evaluation)\b/i,
  ],
};

/** Maps each plugin skill key to its primary intent category. */
export const VENDOR_TO_CATEGORY: Record<string, keyof typeof VENDOR_INTENT_PATTERNS> = {
  // document/* family
  "document/docx": "document",
  "document/xlsx": "document",
  "document/pptx": "document",
  "document/internal-comms": "document",
  // marketing/* family
  "marketing/content-creation": "marketing",
  "marketing/campaign-plan": "marketing",
  "marketing/draft-content": "marketing",
  "marketing/brand-review": "marketing",
  // design/* (vendored ones — design-critique, canvas-design, theme-factory)
  "design/design-critique": "marketing",
  "design/canvas-design": "marketing",
  "design/theme-factory": "marketing",
  // human-resources/* family (vendored T1)
  "human-resources/onboarding": "hr",
  "human-resources/interview-prep": "hr",
  "human-resources/performance-review": "hr",
  "human-resources/policy-lookup": "hr",
  "human-resources/comp-analysis": "hr",
  // sales/* family
  "sales/account-research": "sales_donor",
  "sales/call-prep": "sales_donor",
  "sales/draft-outreach": "sales_donor",
  "sales/daily-briefing": "sales_donor",
  // operations/* family
  "operations/status-report": "operations",
  "operations/process-doc": "operations",
  "operations/risk-assessment": "operations",
  "operations/vendor-review": "operations",
  // data/* family
  "data/analyze": "data",
  "data/build-dashboard": "data",
  // productivity/*
  "productivity/task-management": "productivity",
};

/**
 * Set of skill KEYS that are Edify-native (authored by CLM Studios in apps/web/plugins/<archetype>/).
 * These are always pinned to the active skill set — they're our nonprofit-specific differentiation.
 */
export const EDIFY_NATIVE_SKILL_KEYS: ReadonlySet<string> = new Set<string>([
  // Marketing
  "design/social_card",
  "design/flyer",
  "design/donor_thank_you",
  "design/gala_invite",
  // HR
  "human-resources/volunteer_recruitment_kit",
  "human-resources/recognition_program",
  "human-resources/volunteer_handbook_section",
  // Development
  "development/grant_proposal_writer",
  "development/donor_stewardship_sequence",
  "development/impact_report",
  // Events
  "events/run_of_show",
  "events/sponsor_package",
  "events/post_event_report",
  // Programs
  "programs/logic_model_builder",
  "programs/participant_survey",
  "programs/grant_outcome_report",
  // Executive Assistant
  "executive_assistant/board_meeting_packet",
  "executive_assistant/executive_brief",
  "executive_assistant/action_item_extractor",
]);

/** Hard cap imposed by the Anthropic Skills API (confirmed via PR #41 diagnostic). */
export const SKILL_CAP = 8;

/**
 * Detect which intent categories are signalled by the user message.
 * Returns the set of matched category keys (empty set = no match = neutral fallback).
 */
export function detectIntentCategories(userMessage: string): Set<keyof typeof VENDOR_INTENT_PATTERNS> {
  const matches = new Set<keyof typeof VENDOR_INTENT_PATTERNS>();
  for (const [category, patterns] of Object.entries(VENDOR_INTENT_PATTERNS) as Array<
    [keyof typeof VENDOR_INTENT_PATTERNS, RegExp[]]
  >) {
    if (patterns.some((re) => re.test(userMessage))) {
      matches.add(category);
    }
  }
  return matches;
}
