'use client';

import {
  Star,
  Landmark,
  Megaphone,
  Heart,
  Users,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Archetype {
  slug: string;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  color: string;
  selectedBg: string;
  selectedText: string;
  selectedBorder: string;
}

export const ARCHETYPES: Archetype[] = [
  {
    slug: 'executive_assistant',
    label: 'Executive Assistant',
    shortLabel: 'Executive',
    icon: Star,
    color: 'text-violet-600',
    selectedBg: 'bg-violet-100',
    selectedText: 'text-violet-700',
    selectedBorder: 'border-violet-400',
  },
  {
    slug: 'development_director',
    label: 'Development Director',
    shortLabel: 'Development',
    icon: Landmark,
    color: 'text-sky-600',
    selectedBg: 'bg-sky-100',
    selectedText: 'text-sky-700',
    selectedBorder: 'border-sky-400',
  },
  {
    slug: 'marketing_director',
    label: 'Marketing Director',
    shortLabel: 'Marketing',
    icon: Megaphone,
    color: 'text-amber-600',
    selectedBg: 'bg-amber-100',
    selectedText: 'text-amber-700',
    selectedBorder: 'border-amber-400',
  },
  {
    slug: 'programs_director',
    label: 'Programs Director',
    shortLabel: 'Programs',
    icon: Heart,
    color: 'text-rose-600',
    selectedBg: 'bg-rose-100',
    selectedText: 'text-rose-700',
    selectedBorder: 'border-rose-400',
  },
  {
    slug: 'hr_volunteer_coordinator',
    label: 'HR & Volunteers',
    shortLabel: 'HR',
    icon: Users,
    color: 'text-teal-600',
    selectedBg: 'bg-teal-100',
    selectedText: 'text-teal-700',
    selectedBorder: 'border-teal-400',
  },
  {
    slug: 'events_director',
    label: 'Events Director',
    shortLabel: 'Events',
    icon: Calendar,
    color: 'text-orange-600',
    selectedBg: 'bg-orange-100',
    selectedText: 'text-orange-700',
    selectedBorder: 'border-orange-400',
  },
];

interface TeamSelectorProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function TeamSelector({ selected, onChange }: TeamSelectorProps) {
  function toggle(slug: string) {
    if (selected.includes(slug)) {
      // Keep at least one selected
      if (selected.length === 1) return;
      onChange(selected.filter((s) => s !== slug));
    } else {
      onChange([...selected, slug]);
    }
  }

  function selectAll() {
    onChange(ARCHETYPES.map((a) => a.slug));
  }

  const allSelected = selected.length === ARCHETYPES.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Who reviews it
        </p>
        {!allSelected && (
          <button
            type="button"
            onClick={selectAll}
            className="text-xs text-brand-600 hover:text-brand-700 font-medium transition"
          >
            Select all
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {ARCHETYPES.map((archetype) => {
          const isSelected = selected.includes(archetype.slug);
          const Icon = archetype.icon;
          return (
            <button
              key={archetype.slug}
              type="button"
              onClick={() => toggle(archetype.slug)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150',
                isSelected
                  ? `${archetype.selectedBg} ${archetype.selectedText} ${archetype.selectedBorder}`
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {archetype.shortLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}
