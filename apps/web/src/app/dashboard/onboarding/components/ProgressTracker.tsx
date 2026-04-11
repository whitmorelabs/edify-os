'use client';

import { CheckCircle, Circle } from 'lucide-react';
import { ARCHETYPES } from './ArchetypePicker';

interface ProgressTrackerProps {
  completedSlugs: string[];
  onSelectMember?: (slug: string) => void;
}

export function ProgressTracker({ completedSlugs, onSelectMember }: ProgressTrackerProps) {
  const total = ARCHETYPES.length;
  const completed = completedSlugs.length;
  const pct = Math.round((completed / total) * 100);

  return (
    <div className="card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {completed === 0
              ? 'Meet your team'
              : completed === total
              ? 'You\'ve met everyone!'
              : `You\'ve worked with ${completed} of ${total} team members`}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            {completed === total
              ? 'Your whole team is ready to help.'
              : `${total - completed} specialist${total - completed !== 1 ? 's' : ''} left to explore.`}
          </p>
        </div>
        <span className="text-2xl font-bold text-brand-500">{pct}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full bg-brand-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Team member list */}
      <div className="space-y-1.5">
        {ARCHETYPES.map((arch) => {
          const done = completedSlugs.includes(arch.slug);
          const Icon = arch.icon;

          return (
            <button
              key={arch.slug}
              onClick={() => onSelectMember?.(arch.slug)}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left transition ${
                done
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              {done ? (
                <CheckCircle size={16} className="text-emerald-500 shrink-0" />
              ) : (
                <Circle size={16} className="text-slate-300 shrink-0" />
              )}
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${arch.color}`}>
                <Icon size={13} className="text-white" />
              </div>
              <span className="text-sm font-medium flex-1">{arch.label}</span>
              {!done && (
                <span className="text-[10px] text-brand-500 font-medium">Try now</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
