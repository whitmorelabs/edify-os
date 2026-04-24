import { Landmark, Megaphone, CalendarCheck, BookOpen, UserCheck, CalendarDays, type LucideIcon } from "lucide-react";

export type AgentRoleSlug =
  | "development_director"
  | "marketing_director"
  | "executive_assistant"
  | "programs_director"
  | "hr_volunteer_coordinator"
  | "events_director";

export interface AgentColorConfig {
  bg: string;
  text: string;
  border: string;
  light: string;
  ring: string;
  icon: LucideIcon;
  label: string;
  description: string;
}

export const AGENT_COLORS: Record<AgentRoleSlug, AgentColorConfig> = {
  development_director: {
    bg: "bg-[var(--dir-dev)]",
    text: "text-[var(--dir-dev)]",
    border: "border-[var(--dir-dev)]",
    light: "bg-[color-mix(in_srgb,var(--dir-dev)_12%,transparent)]",
    ring: "ring-[var(--dir-dev)]/20",
    icon: Landmark,
    label: "Director of Development",
    description:
      "Manages fundraising, grant research, donor engagement, and revenue strategy.",
  },
  marketing_director: {
    bg: "bg-[var(--dir-marketing)]",
    text: "text-[var(--dir-marketing)]",
    border: "border-[var(--dir-marketing)]",
    light: "bg-[color-mix(in_srgb,var(--dir-marketing)_12%,transparent)]",
    ring: "ring-[var(--dir-marketing)]/20",
    icon: Megaphone,
    label: "Marketing Director",
    description:
      "Handles brand messaging, social media, email campaigns, and content strategy.",
  },
  executive_assistant: {
    bg: "bg-[var(--dir-exec)]",
    text: "text-[var(--dir-exec)]",
    border: "border-[var(--dir-exec)]",
    light: "bg-[color-mix(in_srgb,var(--dir-exec)_12%,transparent)]",
    ring: "ring-[var(--dir-exec)]/20",
    icon: CalendarCheck,
    label: "Executive Assistant",
    description:
      "Manages schedules, triages emails, preps meetings, and coordinates tasks.",
  },
  programs_director: {
    bg: "bg-[var(--dir-programs)]",
    text: "text-[var(--dir-programs)]",
    border: "border-[var(--dir-programs)]",
    light: "bg-[color-mix(in_srgb,var(--dir-programs)_12%,transparent)]",
    ring: "ring-[var(--dir-programs)]/20",
    icon: BookOpen,
    label: "Programs Director",
    description:
      "Program delivery, outcomes tracking, and compliance reporting.",
  },
  hr_volunteer_coordinator: {
    bg: "bg-[var(--dir-hr)]",
    text: "text-[var(--dir-hr)]",
    border: "border-[var(--dir-hr)]",
    light: "bg-[color-mix(in_srgb,var(--dir-hr)_12%,transparent)]",
    ring: "ring-[var(--dir-hr)]/20",
    icon: UserCheck,
    label: "HR & Volunteer Coordinator",
    description:
      "Staff, volunteers, hiring, and organizational culture.",
  },
  events_director: {
    bg: "bg-[var(--dir-events)]",
    text: "text-[var(--dir-events)]",
    border: "border-[var(--dir-events)]",
    light: "bg-[color-mix(in_srgb,var(--dir-events)_12%,transparent)]",
    ring: "ring-[var(--dir-events)]/20",
    icon: CalendarDays,
    label: "Events Director",
    description:
      "Event planning, sponsorships, and logistics.",
  },
};

export const AGENT_SLUGS = Object.keys(AGENT_COLORS) as AgentRoleSlug[];
