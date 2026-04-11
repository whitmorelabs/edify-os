'use client';

import { Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { ScenarioSummary } from '../api';

interface ScenarioHistoryProps {
  history: ScenarioSummary[];
  onSelect: (id: string) => void;
  activeId?: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function truncate(text: string, max = 60): string {
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text;
}

export function ScenarioHistory({ history, onSelect, activeId }: ScenarioHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition"
      >
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-700">Past Scenarios</span>
          {history.length > 0 && (
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500">
              {history.length}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {/* List */}
      {isExpanded && (
        <div className="border-t border-slate-100">
          {history.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <Clock className="mx-auto h-8 w-8 text-slate-200" />
              <p className="mt-2 text-sm text-slate-400">No past scenarios yet</p>
              <p className="mt-0.5 text-xs text-slate-300">
                Run your first scenario above to get started
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {history.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(item.id)}
                    className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition ${
                      activeId === item.id ? 'bg-brand-50' : ''
                    }`}
                  >
                    <p
                      className={`text-sm leading-snug ${
                        activeId === item.id
                          ? 'font-medium text-brand-700'
                          : 'text-slate-700'
                      }`}
                    >
                      {truncate(item.scenario_text)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {formatDate(item.created_at)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
