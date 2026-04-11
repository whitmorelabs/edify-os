'use client';

import { Plus, Trash2, LayoutGrid } from 'lucide-react';

export interface Program {
  id: string;
  name: string;
  description: string;
  annualBudget: string;
  peopleServed: string;
  keyOutcomes: string;
}

export interface ProgramsData {
  programs: Program[];
}

interface Step2Props {
  data: ProgramsData;
  onChange: (data: ProgramsData) => void;
}

export function newProgram(): Program {
  return {
    id: crypto.randomUUID(),
    name: '',
    description: '',
    annualBudget: '',
    peopleServed: '',
    keyOutcomes: '',
  };
}

export function Step2Programs({ data, onChange }: Step2Props) {
  const { programs } = data;

  const updateProgram = (id: string, field: keyof Program, value: string) => {
    onChange({
      programs: programs.map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      ),
    });
  };

  const addProgram = () => {
    onChange({ programs: [...programs, newProgram()] });
  };

  const removeProgram = (id: string) => {
    if (programs.length <= 1) return;
    onChange({ programs: programs.filter((p) => p.id !== id) });
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
          <LayoutGrid className="h-5 w-5 text-brand-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            What programs do you run?
          </h2>
          <p className="text-sm text-slate-500">
            Your team will refer to these when thinking about strategy, grants, and impact.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {programs.map((program, index) => (
          <div
            key={program.id}
            className="rounded-xl border border-slate-200 bg-white p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">
                Program {index + 1}
              </span>
              {programs.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeProgram(program.id)}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              )}
            </div>

            <div>
              <label className="label mb-1.5 block">Program Name</label>
              <input
                type="text"
                value={program.name}
                onChange={(e) => updateProgram(program.id, 'name', e.target.value)}
                className="input-field"
                placeholder="After-School Tutoring Program"
              />
            </div>

            <div>
              <label className="label mb-1.5 block">Description</label>
              <textarea
                value={program.description}
                onChange={(e) => updateProgram(program.id, 'description', e.target.value)}
                className="input-field"
                rows={2}
                placeholder="In 1-2 sentences: what does this program do and who benefits?"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label mb-1.5 block">
                  Annual Budget{' '}
                  <span className="text-slate-400 normal-case tracking-normal font-normal">
                    (optional)
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={program.annualBudget}
                  onChange={(e) => updateProgram(program.id, 'annualBudget', e.target.value)}
                  className="input-field"
                  placeholder="250000"
                />
              </div>
              <div>
                <label className="label mb-1.5 block">
                  People Served Per Year{' '}
                  <span className="text-slate-400 normal-case tracking-normal font-normal">
                    (optional)
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={program.peopleServed}
                  onChange={(e) => updateProgram(program.id, 'peopleServed', e.target.value)}
                  className="input-field"
                  placeholder="450"
                />
              </div>
            </div>

            <div>
              <label className="label mb-1.5 block">Key Outcomes You Track</label>
              <input
                type="text"
                value={program.keyOutcomes}
                onChange={(e) => updateProgram(program.id, 'keyOutcomes', e.target.value)}
                className="input-field"
                placeholder="e.g. graduation rates, test scores, employment (comma-separated)"
              />
              <p className="mt-1.5 text-xs text-slate-400">
                Separate multiple outcomes with commas
              </p>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addProgram}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-medium text-slate-500 transition-colors hover:border-brand-300 hover:text-brand-600"
      >
        <Plus className="h-4 w-4" />
        Add another program
      </button>
    </div>
  );
}
