import {
  Landmark,
  Megaphone,
  CalendarCheck,
  BookOpen,
  DollarSign,
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
    bg: "bg-emerald-500",
    text: "text-emerald-700",
    border: "border-emerald-500",
    light: "bg-emerald-50",
  },
  marketing_director: {
    slug: "marketing_director",
    label: "Marketing Director",
    description: "Brand messaging, campaigns, and content",
    scanDescription: "Campaign performance, engagement trends, and content opportunities",
    icon: Megaphone,
    bg: "bg-amber-500",
    text: "text-amber-700",
    border: "border-amber-500",
    light: "bg-amber-50",
  },
  executive_assistant: {
    slug: "executive_assistant",
    label: "Executive Assistant",
    description: "Schedules, email triage, and coordination",
    scanDescription: "Upcoming meetings, overdue tasks, and scheduling conflicts",
    icon: CalendarCheck,
    bg: "bg-sky-500",
    text: "text-sky-700",
    border: "border-sky-500",
    light: "bg-sky-50",
  },
  programs_director: {
    slug: "programs_director",
    label: "Programs Director",
    description: "Program delivery, outcomes, and compliance",
    scanDescription: "Reporting deadlines, program milestones, and compliance items",
    icon: BookOpen,
    bg: "bg-violet-500",
    text: "text-violet-700",
    border: "border-violet-500",
    light: "bg-violet-50",
  },
  finance_director: {
    slug: "finance_director",
    label: "Finance Director",
    description: "Cash flow, budgets, and financial health",
    scanDescription: "Budget variances, cash runway, and financial reporting deadlines",
    icon: DollarSign,
    bg: "bg-teal-500",
    text: "text-teal-700",
    border: "border-teal-500",
    light: "bg-teal-50",
  },
  hr_volunteer_coordinator: {
    slug: "hr_volunteer_coordinator",
    label: "HR & Volunteer Coordinator",
    description: "Staff, volunteers, hiring, and organizational culture",
    scanDescription: "Volunteer roles, new applications, and certification expirations",
    icon: UserCheck,
    bg: "bg-indigo-500",
    text: "text-indigo-700",
    border: "border-indigo-500",
    light: "bg-indigo-50",
  },
  events_director: {
    slug: "events_director",
    label: "Events Director",
    description: "Event planning, sponsorships, and logistics",
    scanDescription: "Event milestones, sponsorship pipeline, and post-event follow-ups",
    icon: CalendarDays,
    bg: "bg-rose-500",
    text: "text-rose-700",
    border: "border-rose-500",
    light: "bg-rose-50",
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
