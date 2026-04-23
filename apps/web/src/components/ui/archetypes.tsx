/**
 * UI-facing archetype definitions — the 6 canonical director roles, with
 * colors, glyphs, taglines for dashboard/chat/team visuals.
 *
 * Server-safe archetype slugs live in `@/lib/archetypes` — that's the
 * source of truth for API routes. This module is the UI overlay.
 */

import type { ComponentType, SVGProps } from "react";

export type ArchetypeKey =
  | "exec"
  | "events"
  | "dev"
  | "marketing"
  | "programs"
  | "hr";

export interface Archetype {
  key: ArchetypeKey;
  /** Full role name — e.g. "Executive Assistant". */
  role: string;
  /** Short name for chips / sidebars — e.g. "Executive". */
  short: string;
  /** One-line description of what they do. */
  tagline: string;
  /** Hex color — use for direct color styling (stroke, bg-tint, glow). */
  color: string;
  /** CSS variable name (e.g. "var(--dir-exec)") — for Tailwind-unfriendly places. */
  colorVar: string;
  /** Lucide-style icon component. */
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

/* --------------------------------------------------------------------- */
/* Inline SVG icons — outline, 1.5px stroke, 24×24 viewBox.              */
/* Kept inline (not Lucide) so they stay consistent with design export.  */
/* --------------------------------------------------------------------- */

const IconCalendarCheck: ComponentType<SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <polyline points="9 16 11 18 15 14" />
  </svg>
);

const IconTicket: ComponentType<SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z" />
    <line x1="13" y1="5" x2="13" y2="7" />
    <line x1="13" y1="11" x2="13" y2="13" />
    <line x1="13" y1="17" x2="13" y2="19" />
  </svg>
);

const IconHandHeart: ComponentType<SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M11 14h2a2 2 0 0 0 2-2 2 2 0 0 0-2-2H9.8c-.5 0-1 .2-1.4.5L6.5 12" />
    <path d="m13 17 4-3 3 3-4 4-7-1L4 18v-5l3-1 3.5 1L13 17z" />
    <path d="M12 4.5a2.5 2.5 0 0 1 5 0A2.5 2.5 0 0 1 22 4.5c0 2-3.5 4.5-5 5.5-1.5-1-5-3.5-5-5.5z" />
  </svg>
);

const IconMegaphone: ComponentType<SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m3 11 18-5v12L3 13v-2z" />
    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
  </svg>
);

const IconTarget: ComponentType<SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const IconUsersRound: ComponentType<SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 21a8 8 0 0 0-16 0" />
    <circle cx="10" cy="8" r="5" />
    <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" />
  </svg>
);

/* --------------------------------------------------------------------- */
/* The canonical 6 archetypes — in the order Claude Design uses.         */
/* --------------------------------------------------------------------- */

export const ARCHETYPES: Record<ArchetypeKey, Archetype> = {
  exec: {
    key: "exec",
    role: "Executive Assistant",
    short: "Executive",
    tagline: "Schedules, email, coordination",
    color: "#9F4EF3",
    colorVar: "var(--dir-exec)",
    Icon: IconCalendarCheck,
  },
  events: {
    key: "events",
    role: "Events Director",
    short: "Events",
    tagline: "Galas, house parties, convenings",
    color: "#F472B6",
    colorVar: "var(--dir-events)",
    Icon: IconTicket,
  },
  dev: {
    key: "dev",
    role: "Development Director",
    short: "Development",
    tagline: "Donor research, cultivation, stewardship",
    color: "#F59E5C",
    colorVar: "var(--dir-dev)",
    Icon: IconHandHeart,
  },
  marketing: {
    key: "marketing",
    role: "Marketing Director",
    short: "Marketing",
    tagline: "Newsletters, social, storytelling",
    color: "#7DD3FC",
    colorVar: "var(--dir-marketing)",
    Icon: IconMegaphone,
  },
  programs: {
    key: "programs",
    role: "Programs Director",
    short: "Programs",
    tagline: "Outcomes, participants, reporting",
    color: "#4ADE80",
    colorVar: "var(--dir-programs)",
    Icon: IconTarget,
  },
  hr: {
    key: "hr",
    role: "HR & Volunteer Coordinator",
    short: "HR & Volunteers",
    tagline: "Staff, volunteers, scheduling",
    color: "#FCD34D",
    colorVar: "var(--dir-hr)",
    Icon: IconUsersRound,
  },
};

/** Iterable ordered list of archetypes. */
export const ARCHETYPE_LIST: Archetype[] = [
  ARCHETYPES.exec,
  ARCHETYPES.events,
  ARCHETYPES.dev,
  ARCHETYPES.marketing,
  ARCHETYPES.programs,
  ARCHETYPES.hr,
];
