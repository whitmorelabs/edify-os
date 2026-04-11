'use client';

import { useState, useRef } from 'react';
import { Send } from 'lucide-react';

interface ScenarioInputProps {
  onSubmit: (scenarioText: string) => void;
  isLoading: boolean;
}

export function ScenarioInput({ onSubmit, isLoading }: ScenarioInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charCount = text.length;
  const canSubmit = text.trim().length > 10 && !isLoading;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(text.trim());
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (canSubmit) onSubmit(text.trim());
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 space-y-3">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Describe your decision, idea, or draft... (e.g. 'We're thinking about hiring a part-time grant writer')"
        rows={4}
        disabled={isLoading}
        className="w-full resize-none rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      />

      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-slate-400">
          {charCount > 0 ? (
            <span>{charCount} characters &mdash; aim for 50&ndash;500 for best results</span>
          ) : (
            <span>Press Cmd+Enter to submit</span>
          )}
        </p>

        <button
          type="submit"
          disabled={!canSubmit}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <span>Your team is reviewing</span>
              <span className="flex gap-0.5">
                <span
                  className="inline-block w-1 h-1 rounded-full bg-white"
                  style={{ animation: 'bounce-dot 1.4s ease-in-out 0s infinite' }}
                />
                <span
                  className="inline-block w-1 h-1 rounded-full bg-white"
                  style={{ animation: 'bounce-dot 1.4s ease-in-out 0.2s infinite' }}
                />
                <span
                  className="inline-block w-1 h-1 rounded-full bg-white"
                  style={{ animation: 'bounce-dot 1.4s ease-in-out 0.4s infinite' }}
                />
              </span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Run it by the team
            </>
          )}
        </button>
      </div>
    </form>
  );
}
