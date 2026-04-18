/**
 * Server-safe archetype constants — NO React imports.
 * Import this in API routes and server code.
 * Client-side lib/archetype-config.ts stays separate (it imports Lucide icons).
 */

export const ARCHETYPE_SLUGS = [
  "development_director",
  "marketing_director",
  "executive_assistant",
  "programs_director",
  "hr_volunteer_coordinator",
  "events_director",
] as const;

export type ArchetypeSlug = (typeof ARCHETYPE_SLUGS)[number];

export const ARCHETYPE_LABELS: Record<ArchetypeSlug, string> = {
  development_director: "Director of Development",
  marketing_director: "Marketing Director",
  executive_assistant: "Executive Assistant",
  programs_director: "Programs Director",
  hr_volunteer_coordinator: "HR & Volunteer Coordinator",
  events_director: "Events Director",
};

export const ARCHETYPE_COLORS: Record<ArchetypeSlug, string> = {
  development_director: "bg-emerald-500",
  executive_assistant: "bg-sky-500",
  marketing_director: "bg-amber-500",
  programs_director: "bg-violet-500",
  hr_volunteer_coordinator: "bg-indigo-500",
  events_director: "bg-rose-500",
};
