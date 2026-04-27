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
    "It's a new day. Start by using your tools to gather real data:\n\n1. **Email:** Review recent email threads for grant-related correspondence -- funder replies, submission confirmations, reviewer questions, or partnership inquiries.\n2. **Calendar:** Check if any grant deadlines are approaching in the next 14 days based on calendar entries. Flag submissions, LOI due dates, or funder meetings.\n3. **Grants:** Search for open grant opportunities matching our organization's mission. Surface the top 3 with funder name, dollar range, deadline, and a quick fit assessment (1-10).\n\nIf nothing is due within 30 days, tell me you checked and summarize the next relevant opportunity on the horizon. Always include a recommended next step.",

  marketing_director:
    "It's a new day. Start by using your tools to gather real data:\n\n1. **Email:** Review any recent social media or content-related emails -- platform notifications, collaboration requests, press inquiries, or content feedback.\n2. **Calendar:** Check calendar for upcoming content deadlines, campaign launches, or media appearances this week.\n3. **Content:** Based on what you find, suggest 2-3 ready-to-use social post ideas or a newsletter angle, each with a hook, platform recommendation, and a call to action.\n\nKeep everything aligned with our brand voice. If there are active campaigns, prioritize those over new ideas.",

  executive_assistant:
    "It's a new day. Start by using your tools to gather real data:\n\n1. **Calendar:** Check the connected calendar for today's and this week's meetings. Flag any that need prep documents, agendas, or follow-up from previous sessions.\n2. **Email:** Scan recent emails for anything requiring the ED's attention -- time-sensitive requests, board communications, donor messages, or scheduling conflicts.\n3. **Priorities:** Based on what you find in calendar and email, list the top 3 things that need attention this morning.\n\nEnd with a clear 'what you need to do' block with concrete actions, not vague reminders.",

  programs_director:
    "It's a new day. Start by using your tools to gather real data:\n\n1. **Calendar:** Check calendar for upcoming program deadlines, evaluations, reporting due dates, or compliance milestones in the next 14 days.\n2. **Conversations:** Review recent conversations for any program data that should be logged -- outcome metrics, participant feedback, or status updates mentioned in passing.\n3. **Grants:** Check for any grant compliance dates or outcome-reporting obligations tied to active funding.\n\nIf any are critical, flag them with the deadline, what's needed, and the suggested next step. If nothing is due, summarize the next milestone coming up so nothing catches us off guard.",

  hr_volunteer_coordinator:
    "It's a new day. Start by using your tools to gather real data:\n\n1. **Calendar:** Check calendar for onboarding dates, training sessions, volunteer events, or review meetings this week and next.\n2. **Paperwork:** Review if any new hire paperwork, volunteer applications, or compliance documents need processing or follow-up.\n3. **Team status:** Based on what you find, flag anything with a deadline or time-sensitive element and suggest the action.\n\nIf everything is clear, confirm you've checked and give a brief status on team and volunteer readiness. Call out any volunteer appreciation moments or milestones worth recognizing.",

  events_director:
    "It's a new day. Start by using your tools to gather real data:\n\n1. **Calendar:** Check calendar for upcoming events in the next 30 days. Pull actual dates, times, and any notes attached to event entries.\n2. **Logistics:** Review if any event logistics -- venue confirmations, catering orders, AV setup, vendor contracts, or volunteer assignments -- need confirmation or follow-up.\n3. **Critical path:** For each event in the next 7 days, identify blockers that need to lock. Include the event date, what needs to lock, the owner, and the deadline.\n\nIf there are no blockers, confirm the status and call out the single most important thing to stay on top of this week.",
};
