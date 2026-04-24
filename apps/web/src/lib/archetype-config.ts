import {
  Landmark,
  Megaphone,
  CalendarCheck,
  BookOpen,

  UserCheck,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";
import type { ArchetypeSlug } from "@/app/dashboard/inbox/heartbeats";

export interface ArchetypeMetadata {
  slug: ArchetypeSlug;
  label: string;
  description: string;
  /** What this team member scans for during check-ins */
  scanDescription: string;
  icon: LucideIcon;
  bg: string;
  text: string;
  border: string;
  light: string;
}

export const ARCHETYPE_CONFIG: Record<ArchetypeSlug, ArchetypeMetadata> = {
  development_director: {
    slug: "development_director",
    label: "Director of Development",
    description: "Fundraising, grants, and donor engagement",
    scanDescription: "Grant deadlines, donor signals, and fundraising momentum",
    icon: Landmark,
    bg: "bg-[var(--dir-dev)]",
    text: "text-[var(--dir-dev)]",
    border: "border-[var(--dir-dev)]",
    light: "bg-[color-mix(in_srgb,var(--dir-dev)_12%,transparent)]",
  },
  marketing_director: {
    slug: "marketing_director",
    label: "Marketing Director",
    description: "Brand messaging, campaigns, and content",
    scanDescription: "Campaign performance, engagement trends, and content opportunities",
    icon: Megaphone,
    bg: "bg-[var(--dir-marketing)]",
    text: "text-[var(--dir-marketing)]",
    border: "border-[var(--dir-marketing)]",
    light: "bg-[color-mix(in_srgb,var(--dir-marketing)_12%,transparent)]",
  },
  executive_assistant: {
    slug: "executive_assistant",
    label: "Executive Assistant",
    description: "Schedules, email triage, and coordination",
    scanDescription: "Upcoming meetings, overdue tasks, and scheduling conflicts",
    icon: CalendarCheck,
    bg: "bg-[var(--dir-exec)]",
    text: "text-[var(--dir-exec)]",
    border: "border-[var(--dir-exec)]",
    light: "bg-[color-mix(in_srgb,var(--dir-exec)_12%,transparent)]",
  },
  programs_director: {
    slug: "programs_director",
    label: "Programs Director",
    description: "Program delivery, outcomes, and compliance",
    scanDescription: "Reporting deadlines, program milestones, and compliance items",
    icon: BookOpen,
    bg: "bg-[var(--dir-programs)]",
    text: "text-[var(--dir-programs)]",
    border: "border-[var(--dir-programs)]",
    light: "bg-[color-mix(in_srgb,var(--dir-programs)_12%,transparent)]",
  },
  hr_volunteer_coordinator: {
    slug: "hr_volunteer_coordinator",
    label: "HR & Volunteer Coordinator",
    description: "Staff, volunteers, hiring, and organizational culture",
    scanDescription: "Volunteer roles, new applications, and certification expirations",
    icon: UserCheck,
    bg: "bg-[var(--dir-hr)]",
    text: "text-[var(--dir-hr)]",
    border: "border-[var(--dir-hr)]",
    light: "bg-[color-mix(in_srgb,var(--dir-hr)_12%,transparent)]",
  },
  events_director: {
    slug: "events_director",
    label: "Events Director",
    description: "Event planning, sponsorships, and logistics",
    scanDescription: "Event milestones, sponsorship pipeline, and post-event follow-ups",
    icon: CalendarDays,
    bg: "bg-[var(--dir-events)]",
    text: "text-[var(--dir-events)]",
    border: "border-[var(--dir-events)]",
    light: "bg-[color-mix(in_srgb,var(--dir-events)_12%,transparent)]",
  },
};

export const ARCHETYPE_SLUGS = Object.keys(ARCHETYPE_CONFIG) as ArchetypeSlug[];

/** Returns a human-readable schedule preview for a given config */
export function buildSchedulePreview(
  label: string,
  frequencyHours: number,
  activeHoursStart: number,
  activeHoursEnd: number
): string {
  const formatHour = (h: number) => {
    if (h === 0) return "12 AM";
    if (h === 12) return "12 PM";
    if (h < 12) return `${h} AM`;
    return `${h - 12} PM`;
  };

  if (frequencyHours >= 24) {
    return `Your ${label} will check in once daily at ${formatHour(activeHoursStart)}.`;
  }

  const checkInTimes: string[] = [];
  for (let h = activeHoursStart; h <= activeHoursEnd; h += frequencyHours) {
    checkInTimes.push(formatHour(h));
  }

  if (checkInTimes.length === 0) return `Your ${label} will check in during active hours.`;
  if (checkInTimes.length === 1) return `Your ${label} will check in at ${checkInTimes[0]}.`;

  const last = checkInTimes.pop();
  return `Your ${label} will check in at ${checkInTimes.join(", ")}, and ${last}.`;
}
