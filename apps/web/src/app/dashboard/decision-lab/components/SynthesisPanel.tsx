import { CheckCircle2, AlertTriangle, XCircle, Lightbulb } from 'lucide-react';
import type { SynthesisResult } from '../api';

interface SynthesisPanelProps {
  synthesis: SynthesisResult;
}

export function SynthesisPanel({ synthesis }: SynthesisPanelProps) {
  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
        <h2 className="heading-2 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-brand-500" />
          Team Synthesis
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">
          What your team collectively sees in this decision
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {/* Consensus */}
        {synthesis.consensus.length > 0 && (
          <section className="px-5 py-4 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <h3 className="text-sm font-semibold text-slate-900">Where your team agrees</h3>
            </div>
            <ul className="space-y-1.5 pl-6">
              {synthesis.consensus.map((point, i) => (
                <li key={i} className="text-sm text-slate-600 leading-relaxed list-disc">
                  {point}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Disagreements */}
        {synthesis.disagreements.length > 0 && (
          <section className="px-5 py-4 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
              <h3 className="text-sm font-semibold text-slate-900">Where they disagree</h3>
            </div>
            <ul className="space-y-1.5 pl-6">
              {synthesis.disagreements.map((point, i) => (
                <li key={i} className="text-sm text-slate-600 leading-relaxed list-disc">
                  {point}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Top risks */}
        {synthesis.top_risks.length > 0 && (
          <section className="px-5 py-4 space-y-2">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500 shrink-0" />
              <h3 className="text-sm font-semibold text-slate-900">Top risks</h3>
            </div>
            <ul className="space-y-1.5 pl-6">
              {synthesis.top_risks.map((risk, i) => (
                <li key={i} className="text-sm text-slate-600 leading-relaxed list-disc">
                  {risk}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Recommended action */}
        {synthesis.recommended_action && (
          <section className="px-5 py-4">
            <div className="rounded-xl bg-brand-50 border border-brand-100 p-4 space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                Recommended action
              </p>
              <p className="text-sm text-slate-800 leading-relaxed">
                {synthesis.recommended_action}
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
