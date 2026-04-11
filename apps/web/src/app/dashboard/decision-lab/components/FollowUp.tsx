'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';
import type { ArchetypeResponse, Confidence, Stance } from '../api';

interface FollowUpProps {
  isOpen: boolean;
  archetypeName: string;
  originalResponse: string;
  onClose: () => void;
  onAsk: (question: string) => Promise<ArchetypeResponse>;
}

const CONFIDENCE_LABEL: Record<Confidence, string> = {
  Low: 'Low confidence',
  Medium: 'Medium confidence',
  High: 'High confidence',
};

const STANCE_STYLES: Record<Stance, string> = {
  Support: 'text-emerald-700 bg-emerald-50',
  Caution: 'text-amber-700 bg-amber-50',
  Oppose: 'text-red-700 bg-red-50',
};

export function FollowUp({
  isOpen,
  archetypeName,
  originalResponse,
  onClose,
  onAsk,
}: FollowUpProps) {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [followUpResponse, setFollowUpResponse] = useState<ArchetypeResponse | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuestion('');
      setFollowUpResponse(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const resp = await onAsk(question.trim());
      setFollowUpResponse(resp);
    } catch {
      setFollowUpResponse({
        role_slug: '',
        display_name: archetypeName,
        icon: 'MessageCircle',
        stance: 'Caution',
        response_text:
          "I wasn't able to process that question right now. Please try again in a moment.",
        confidence: 'Low',
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50">
              <MessageCircle className="h-4 w-4 text-brand-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{archetypeName}</p>
              <p className="text-xs text-slate-400">Follow-up conversation</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scroll area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Original response */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">
              Original response
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">{originalResponse}</p>
          </div>

          {/* Follow-up response */}
          {followUpResponse && (
            <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-brand-600">
                  Follow-up response
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      STANCE_STYLES[followUpResponse.stance]
                    }`}
                  >
                    {followUpResponse.stance}
                  </span>
                  <span className="text-xs text-slate-400">
                    {CONFIDENCE_LABEL[followUpResponse.confidence]}
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-800 leading-relaxed">
                {followUpResponse.response_text}
              </p>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-slate-100 p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              ref={inputRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={`Ask ${archetypeName} a follow-up question...`}
              rows={3}
              disabled={isLoading}
              className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!question.trim() || isLoading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span>Waiting for response...</span>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Ask {archetypeName.split(' ')[0]}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
