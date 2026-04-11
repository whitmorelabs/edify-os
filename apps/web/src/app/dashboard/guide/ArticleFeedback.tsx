'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface ArticleFeedbackProps {
  slug: string;
}

type FeedbackState = 'idle' | 'yes' | 'no' | 'submitted';

export function ArticleFeedback({ slug: _slug }: ArticleFeedbackProps) {
  const [state, setState] = useState<FeedbackState>('idle');

  const handleFeedback = (helpful: boolean) => {
    setState(helpful ? 'yes' : 'no');
    // Future: POST /api/guide-feedback with { slug, helpful }
  };

  const handleSubmit = () => {
    setState('submitted');
  };

  if (state === 'submitted') {
    return (
      <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
        <p className="text-sm font-medium text-slate-700">Thanks for the feedback!</p>
        <p className="mt-1 text-xs text-slate-500">It helps us improve the help center.</p>
      </div>
    );
  }

  return (
    <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-sm font-medium text-slate-700">Was this article helpful?</p>

      {state === 'idle' && (
        <div className="mt-3 flex gap-3">
          <button
            onClick={() => handleFeedback(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:border-emerald-300 hover:text-emerald-700 transition"
          >
            <ThumbsUp size={14} />
            Yes, helpful
          </button>
          <button
            onClick={() => handleFeedback(false)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:border-red-300 hover:text-red-600 transition"
          >
            <ThumbsDown size={14} />
            Not really
          </button>
        </div>
      )}

      {state === 'no' && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-slate-500">What could be better?</p>
          <textarea
            className="input-field text-xs"
            rows={3}
            placeholder="Tell us what's missing or confusing..."
          />
          <button onClick={handleSubmit} className="btn-primary text-xs px-4 py-2">
            Send Feedback
          </button>
        </div>
      )}

      {state === 'yes' && (
        <div className="mt-3">
          <button onClick={handleSubmit} className="text-xs text-slate-400 hover:text-slate-600 transition">
            Thanks, dismiss
          </button>
        </div>
      )}
    </div>
  );
}
