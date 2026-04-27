'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  MessageCircle,
  Table2,
  Mail,
  BookOpen,
  Copy,
  Check,
  Loader2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StoryFormat =
  | 'grant_narrative'
  | 'social_post'
  | 'board_table'
  | 'donor_email'
  | 'annual_report';

interface FormatOption {
  key: StoryFormat;
  label: string;
  description: string;
  icon: typeof FileText;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FORMAT_OPTIONS: FormatOption[] = [
  {
    key: 'grant_narrative',
    label: 'Grant Narrative',
    description: 'Formal, evidence-based section for proposals and reports',
    icon: FileText,
  },
  {
    key: 'social_post',
    label: 'Social Post',
    description: 'Casual, shareable, under 280 characters',
    icon: MessageCircle,
  },
  {
    key: 'board_table',
    label: 'Board Report',
    description: 'Structured table with targets vs actuals',
    icon: Table2,
  },
  {
    key: 'donor_email',
    label: 'Donor Email',
    description: 'Warm, personal, gratitude and impact',
    icon: Mail,
  },
  {
    key: 'annual_report',
    label: 'Annual Report',
    description: 'Polished narrative section with highlights',
    icon: BookOpen,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StoryBuilderPage() {
  const [programs, setPrograms] = useState<string[]>([]);
  const [periods, setPeriods] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<StoryFormat | ''>('');

  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // Fetch available programs and periods from impact data
  useEffect(() => {
    fetch('/api/impact-data')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setPrograms(data.programs ?? []);
          setPeriods(data.periods ?? []);
        }
      })
      .catch(() => {
        // No impact data available
      })
      .finally(() => setLoading(false));
  }, []);

  const canGenerate = selectedProgram && selectedPeriod && selectedFormat;

  async function handleGenerate() {
    if (!canGenerate) return;
    setGenerating(true);
    setGeneratedContent('');
    setEditedContent('');
    setError('');

    try {
      const res = await fetch('/api/story/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program: selectedProgram,
          period: selectedPeriod,
          format: selectedFormat,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed (${res.status})`);
      }

      const result = await res.json();
      setGeneratedContent(result.content);
      setEditedContent(result.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate content');
    } finally {
      setGenerating(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(editedContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // Determine which step the user is on
  const currentStep = !selectedProgram
    ? 1
    : !selectedPeriod
      ? 2
      : !selectedFormat
        ? 3
        : generatedContent
          ? 4
          : 3;

  // ---------------------------------------------------------------------------
  // Empty state: no impact data logged yet
  // ---------------------------------------------------------------------------

  if (!loading && programs.length === 0) {
    return (
      <div className="max-w-2xl mx-auto mt-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-brand-900/50 border border-brand-700/30 flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-8 h-8 text-brand-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Story Builder</h1>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          No program data yet. Chat with your Programs Director to log outcomes,
          then come back here to turn those numbers into grant narratives, social
          posts, board reports, and more.
        </p>
        <a
          href="/dashboard/team/programs_director"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-500 transition"
        >
          Talk to Programs Director
          <ChevronRight size={16} />
        </a>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main UI
  // ---------------------------------------------------------------------------

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Story Builder</h1>
        <p className="text-gray-500 mt-1">
          Transform your program data into ready-to-use narratives
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {['Program', 'Period', 'Format', 'Preview'].map((label, idx) => {
          const stepNum = idx + 1;
          const isActive = currentStep === stepNum;
          const isComplete = currentStep > stepNum;
          return (
            <div key={label} className="flex items-center gap-2">
              {idx > 0 && (
                <div
                  className={`w-8 h-px ${isComplete || isActive ? 'bg-brand-500' : 'bg-gray-200'}`}
                />
              )}
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  isActive
                    ? 'bg-brand-100 text-brand-700'
                    : isComplete
                      ? 'bg-brand-50 text-brand-600'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive
                      ? 'bg-brand-600 text-white'
                      : isComplete
                        ? 'bg-brand-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isComplete ? <Check size={10} /> : stepNum}
                </span>
                {label}
              </div>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Step 1: Select program */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Program
            </label>
            <select
              value={selectedProgram}
              onChange={(e) => {
                setSelectedProgram(e.target.value);
                setGeneratedContent('');
                setEditedContent('');
              }}
              className="w-full max-w-md rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="">Select a program...</option>
              {programs.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Select period */}
          {selectedProgram && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Period
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => {
                  setSelectedPeriod(e.target.value);
                  setGeneratedContent('');
                  setEditedContent('');
                }}
                className="w-full max-w-md rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              >
                <option value="">Select a period...</option>
                {periods.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Step 3: Select format */}
          {selectedProgram && selectedPeriod && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Output Format
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {FORMAT_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = selectedFormat === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => {
                        setSelectedFormat(opt.key);
                        setGeneratedContent('');
                        setEditedContent('');
                      }}
                      className={`flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20'
                          : 'border-gray-200 bg-white hover:border-brand-300 hover:bg-brand-50/50'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          isSelected
                            ? 'bg-brand-600 text-white'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <Icon size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {opt.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {opt.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Generate button */}
          {canGenerate && !generatedContent && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generate Content
                </>
              )}
            </button>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Step 4: Preview and edit */}
          {generatedContent && (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
                <span className="text-sm font-medium text-gray-700">
                  Generated Content
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
                  >
                    {copied ? (
                      <>
                        <Check size={14} className="text-green-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        Copy
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setGeneratedContent('');
                      setEditedContent('');
                      handleGenerate();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-brand-600 hover:bg-brand-50 transition"
                  >
                    <Sparkles size={14} />
                    Regenerate
                  </button>
                </div>
              </div>
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full min-h-[240px] p-5 text-sm text-gray-800 leading-relaxed resize-y focus:outline-none"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
