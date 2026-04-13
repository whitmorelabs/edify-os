'use client';

import {
  Landmark,
  Megaphone,
  CalendarCheck,
  ClipboardList,
  UserCog,
  PartyPopper,
  type LucideIcon,
} from 'lucide-react';

export interface Archetype {
  slug: string;
  icon: LucideIcon;
  label: string;
  tagline: string;
  description: string;
  color: string;
  textColor: string;
  bgLight: string;
}

export const ARCHETYPES: Archetype[] = [
  {
    slug: 'development-director',
    icon: Landmark,
    label: 'Development Director',
    tagline: 'Grants & Fundraising',
    description: 'Find grants, write proposals, steward donors, build your revenue pipeline.',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-700',
    bgLight: 'bg-emerald-50',
  },
  {
    slug: 'marketing-director',
    icon: Megaphone,
    label: 'Marketing Director',
    tagline: 'Comms & Content',
    description: 'Social posts, newsletters, press releases, and brand storytelling.',
    color: 'bg-amber-500',
    textColor: 'text-amber-700',
    bgLight: 'bg-amber-50',
  },
  {
    slug: 'executive-assistant',
    icon: CalendarCheck,
    label: 'Executive Assistant',
    tagline: 'Operations & Scheduling',
    description: 'Email triage, meeting prep, task tracking, and day-to-day coordination.',
    color: 'bg-sky-500',
    textColor: 'text-sky-700',
    bgLight: 'bg-sky-50',
  },
  {
    slug: 'programs-director',
    icon: ClipboardList,
    label: 'Programs Director',
    tagline: 'Program Design & Evaluation',
    description: 'Logic models, outcome measurement, grant reports, and compliance.',
    color: 'bg-violet-500',
    textColor: 'text-violet-700',
    bgLight: 'bg-violet-50',
  },
  {
    slug: 'hr-volunteer-coordinator',
    icon: UserCog,
    label: 'HR & Volunteer Coordinator',
    tagline: 'People & HR',
    description: 'Hiring, volunteer programs, HR policies, and staff training.',
    color: 'bg-rose-500',
    textColor: 'text-rose-700',
    bgLight: 'bg-rose-50',
  },
  {
    slug: 'events-director',
    icon: PartyPopper,
    label: 'Events Director',
    tagline: 'Events & Sponsorships',
    description: 'Event planning, run of show, sponsorship packages, and post-event evaluation.',
    color: 'bg-orange-500',
    textColor: 'text-orange-700',
    bgLight: 'bg-orange-50',
  },
];

interface ArchetypePickerProps {
  onSelect: (slug: string) => void;
  completedSlugs: string[];
}

export function ArchetypePicker({ onSelect, completedSlugs }: ArchetypePickerProps) {
  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Who do you want to work with first?</h2>
        <p className="mt-1 text-slate-500">
          Pick one team member to start. You can work with all six -- but let&apos;s begin somewhere.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {ARCHETYPES.map((arch) => {
          const Icon = arch.icon;
          const done = completedSlugs.includes(arch.slug);
          return (
            <button
              key={arch.slug}
              onClick={() => onSelect(arch.slug)}
              className={`text-left rounded-xl border-2 p-4 transition-all duration-200 flex gap-3 items-start relative group ${
                done
                  ? 'border-emerald-300 bg-emerald-50/50'
                  : 'border-slate-200 hover:border-brand-300 hover:shadow-md bg-white'
              }`}
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${arch.color}`}>
                <Icon size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`font-semibold text-sm ${arch.textColor}`}>{arch.label}</p>
                  {done && (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                      Done
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{arch.tagline}</p>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">{arch.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
