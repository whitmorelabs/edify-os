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
    bg: "bg-emerald-500",
    text: "text-emerald-700",
    border: "border-emerald-500",
    light: "bg-emerald-50",
    ring: "ring-emerald-500/20",
    icon: Landmark,
    label: "Director of Development",
    description:
      "Manages fundraising, grant research, donor engagement, and revenue strategy.",
  },
  marketing_director: {
    bg: "bg-amber-500",
    text: "text-amber-700",
    border: "border-amber-500",
    light: "bg-amber-50",
    ring: "ring-amber-500/20",
    icon: Megaphone,
    label: "Marketing Director",
    description:
      "Handles brand messaging, social media, email campaigns, and content strategy.",
  },
  executive_assistant: {
    bg: "bg-sky-500",
    text: "text-sky-700",
    border: "border-sky-500",
    light: "bg-sky-50",
    ring: "ring-sky-500/20",
    icon: CalendarCheck,
    label: "Executive Assistant",
    description:
      "Manages schedules, triages emails, preps meetings, and coordinates tasks.",
  },
  programs_director: {
    bg: "bg-violet-500",
    text: "text-violet-700",
    border: "border-violet-500",
    light: "bg-violet-50",
    ring: "ring-violet-500/20",
    icon: BookOpen,
    label: "Programs Director",
    description:
      "Program delivery, outcomes tracking, and compliance reporting.",
  },
  hr_volunteer_coordinator: {
    bg: "bg-indigo-500",
    text: "text-indigo-700",
    border: "border-indigo-500",
    light: "bg-indigo-50",
    ring: "ring-indigo-500/20",
    icon: UserCheck,
    label: "HR & Volunteer Coordinator",
    description:
      "Staff, volunteers, hiring, and organizational culture.",
  },
  events_director: {
    bg: "bg-rose-500",
    text: "text-rose-700",
    border: "border-rose-500",
    light: "bg-rose-50",
    ring: "ring-rose-500/20",
    icon: CalendarDays,
    label: "Events Director",
    description:
      "Event planning, sponsorships, and logistics.",
  },
};

export const AGENT_SLUGS = Object.keys(AGENT_COLORS) as AgentRoleSlug[];
