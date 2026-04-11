'use client';

import { Target, Check } from 'lucide-react';

export interface GoalsData {
  selectedGoals: string[];
  additionalContext: string;
}

interface Step3Props {
  data: GoalsData;
  onChange: (data: GoalsData) => void;
}

const GOAL_OPTIONS = [
  { id: 'fundraising_revenue', label: 'Increase fundraising revenue' },
  { id: 'grow_donor_base', label: 'Grow our donor base' },
  { id: 'improve_outcomes', label: 'Improve program outcomes' },
  { id: 'expand_locations', label: 'Expand to new locations or communities' },
  { id: 'hire_staff', label: 'Hire more staff' },
  { id: 'volunteer_program', label: 'Strengthen volunteer program' },
  { id: 'marketing_comms', label: 'Improve marketing & communications' },
  { id: 'prepare_audit', label: 'Prepare for an audit' },
  { id: 'major_event', label: 'Plan a major event' },
  { id: 'new_grants', label: 'Apply for new grants' },
  { id: 'financial_management', label: 'Improve financial management' },
  { id: 'strategic_plan', label: 'Develop a strategic plan' },
];

export function Step3Goals({ data, onChange }: Step3Props) {
  const toggleGoal = (goalId: string) => {
    const next = data.selectedGoals.includes(goalId)
      ? data.selectedGoals.filter((g) => g !== goalId)
      : [...data.selectedGoals, goalId];
    onChange({ ...data, selectedGoals: next });
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
          <Target className="h-5 w-5 text-brand-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            What are your top priorities this year?
          </h2>
          <p className="text-sm text-slate-500">
            Your team will focus their weekly check-ins on what matters most to you.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {GOAL_OPTIONS.map((goal) => {
          const isSelected = data.selectedGoals.includes(goal.id);
          return (
            <button
              key={goal.id}
              type="button"
              onClick={() => toggleGoal(goal.id)}
              className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm transition-all ${
                isSelected
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                  isSelected
                    ? 'border-brand-500 bg-brand-500'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {isSelected && <Check className="h-3 w-3 text-white" />}
              </div>
              <span className="font-medium leading-snug">{goal.label}</span>
            </button>
          );
        })}
      </div>

      {data.selectedGoals.length > 0 && (
        <p className="text-xs text-brand-600 font-medium">
          {data.selectedGoals.length} priorit{data.selectedGoals.length === 1 ? 'y' : 'ies'} selected
        </p>
      )}

      <div>
        <label className="label mb-1.5 block">
          Anything else your team should know?{' '}
          <span className="text-slate-400 normal-case tracking-normal font-normal">
            (optional)
          </span>
        </label>
        <textarea
          value={data.additionalContext}
          onChange={(e) => onChange({ ...data, additionalContext: e.target.value })}
          className="input-field"
          rows={4}
          placeholder="Big challenges, recent wins, context that would help your team give you better advice..."
        />
      </div>
    </div>
  );
}
