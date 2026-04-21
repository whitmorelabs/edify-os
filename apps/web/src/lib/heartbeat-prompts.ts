/**
 * Per-archetype proactive heartbeat prompts.
 *
 * Each value is the "user message" sent to the archetype at the start of its
 * daily check-in. The prompt kicks off a tool-use loop using the archetype's
 * existing tool set (grants, calendar, Gmail, Drive, CRM, etc.) and asks the
 * archetype to surface whatever is most relevant for that day.
 *
 * Tone is calibrated to each archetype's personality from archetype-prompts.ts:
 *  - development_director  → data-driven, deadline-aware
 *  - marketing_director    → creative-first, story-driven
 *  - executive_assistant   → action-oriented, concise
 *  - programs_director     → evidence-based, outcome-focused
 *  - hr_volunteer_coordinator → people-first, warm
 *  - events_director       → timeline-driven, high-energy
 */

import type { ArchetypeSlug } from "@/lib/archetypes";

export const ARCHETYPE_HEARTBEAT_PROMPTS: Record<ArchetypeSlug, string> = {
  development_director:
    "It's a new day. Proactively check for grant opportunities matching our organization's mission. Search for open grants, review deadlines, and surface the top 3 with funder name, dollar range, deadline, and a quick fit assessment (1-10). If nothing is due within 30 days, tell me you checked and summarize the next relevant opportunity on the horizon. Always include a recommended next step.",

  marketing_director:
    "It's a new day. Review what content would be most relevant to post today based on our organization's mission and any upcoming events or campaigns. Suggest 2-3 ready-to-use social post ideas or a newsletter angle, each with a hook, platform recommendation, and a call to action. Keep everything aligned with our brand voice.",

  executive_assistant:
    "It's a new day. Check today's calendar for meetings, flag anything that needs prep, and list the top 3 things that need attention this morning. If Gmail is connected, scan for unread threads that look time-sensitive and surface any that need a response today. End with a clear 'what you need to do' block.",

  programs_director:
    "It's a new day. Check for any upcoming program deadlines, outcome-reporting obligations, or grant compliance dates in the next 14 days. If any are critical, flag them with the deadline, what's needed, and the suggested next step. If nothing is due, summarize the next milestone coming up so nothing catches us off guard.",

  hr_volunteer_coordinator:
    "It's a new day. Check whether any onboarding tasks, training dates, policy reviews, or volunteer appreciation moments need attention this week. Flag anything with a deadline or time-sensitive element and suggest the action. If everything is clear, confirm you've checked and give a brief status on team and volunteer readiness.",

  events_director:
    "It's a new day. Review all upcoming events and flag critical-path items that need to lock in the next 7 days. For each blocker, include the event date, what needs to lock, the owner, and the deadline. If there are no blockers, confirm the status and call out the single most important thing to stay on top of this week.",
};
