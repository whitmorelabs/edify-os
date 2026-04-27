'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import {
  Sun,
  Sunrise,
  Moon,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Eye,
  Scale,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { AGENT_COLORS, type AgentRoleSlug } from '@/lib/agent-colors';

/* ------------------------------------------------------------------ */
/* Types matching the generator output                                 */
/* ------------------------------------------------------------------ */

interface BriefingPriority {
  agent: string;
  agentLabel: string;
  text: string;
  link: string;
}

interface BriefingWeekItem {
  agent: string;
  agentLabel: string;
  items: string[];
}

interface BriefingInputItem {
  agent: string;
  agentLabel: string;
  title: string;
  type: string;
  context: string;
  link: string;
}

interface Briefing {
  date: string;
  priorities: BriefingPriority[];
  thisWeek: BriefingWeekItem[];
  needsInput: BriefingInputItem[];
  errors?: string[];
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getGreetingIcon() {
  const hour = new Date().getHours();
  if (hour < 12) return <Sunrise size={20} className="text-amber-400" />;
  if (hour < 18) return <Sun size={20} className="text-amber-400" />;
  return <Moon size={20} className="text-indigo-400" />;
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function getAgentColor(slug: string): string {
  const config = AGENT_COLORS[slug as AgentRoleSlug];
  if (!config) return 'var(--brand-purple)';
  // Extract the CSS variable from the bg class
  const match = config.bg.match(/var\(([^)]+)\)/);
  return match ? `var(${match[1]})` : '#9F4EF3';
}

function getActionIcon(type: string) {
  switch (type) {
    case 'approve':
      return <CheckCircle2 size={14} />;
    case 'review':
      return <Eye size={14} />;
    case 'decide':
      return <Scale size={14} />;
    default:
      return <ArrowRight size={14} />;
  }
}

function getActionLabel(type: string): string {
  switch (type) {
    case 'approve':
      return 'Approve';
    case 'review':
      return 'Review';
    case 'decide':
      return 'Decide';
    default:
      return 'View';
  }
}

/* ------------------------------------------------------------------ */
/* Skeleton loader                                                     */
/* ------------------------------------------------------------------ */

function BriefingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-48 rounded bg-white/5" />
        <div className="h-8 w-72 rounded bg-white/5" />
      </div>

      {/* Priorities skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-40 rounded bg-white/5" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-white/10 mt-2 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-20 rounded bg-white/5" />
                <div className="h-4 w-full rounded bg-white/5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* This week skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-32 rounded bg-white/5" />
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
            <div className="space-y-2">
              <div className="h-3 w-32 rounded bg-white/5" />
              <div className="h-3 w-full rounded bg-white/5" />
              <div className="h-3 w-3/4 rounded bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */

function EmptyState({ onGenerate, loading }: { onGenerate: () => void; loading: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: 'rgba(159,78,243,0.1)', border: '1px solid rgba(159,78,243,0.2)' }}
      >
        <Sunrise size={28} className="text-brand-400" />
      </div>
      <h2 className="text-lg font-semibold text-white mb-2">
        No briefing yet today
      </h2>
      <p className="text-sm text-brand-200 mb-8 max-w-md">
        Your AI team will analyze your organization and compile a unified morning intelligence
        briefing with priorities, weekly outlook, and items needing your attention.
      </p>
      <button
        onClick={onGenerate}
        disabled={loading}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: 'linear-gradient(135deg, rgba(159,78,243,0.8), rgba(120,50,220,0.9))',
          boxShadow: '0 0 20px rgba(159,78,243,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        {loading ? (
          <>
            <RefreshCw size={16} className="animate-spin" />
            Generating briefing...
          </>
        ) : (
          <>
            <Zap size={16} />
            Generate Briefing
          </>
        )}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main page component                                                 */
/* ------------------------------------------------------------------ */

export default function BriefingTodayPage() {
  const { user } = useAuth();
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayName = (() => {
    const meta = user?.user_metadata as Record<string, string> | undefined;
    if (meta?.full_name) return meta.full_name.split(' ')[0];
    if (meta?.name) return meta.name.split(' ')[0];
    if (user?.email) {
      const local = user.email.split('@')[0] ?? '';
      return local.charAt(0).toUpperCase() + local.slice(1);
    }
    return '';
  })();

  // Fetch today's briefing on mount
  useEffect(() => {
    fetch('/api/briefing/generate')
      .then((res) => {
        if (res.status === 404) return null;
        if (!res.ok) throw new Error('Failed to fetch briefing');
        return res.json();
      })
      .then((data: Briefing | null) => {
        if (data) setBriefing(data);
      })
      .catch((err) => {
        console.error('Failed to load briefing:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/briefing/generate', { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(body.error || 'Failed to generate briefing');
      }
      const data: Briefing = await res.json();
      setBriefing(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate briefing';
      setError(msg);
    } finally {
      setGenerating(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="mx-auto px-6 lg:px-10" style={{ maxWidth: 860 }}>
        <BriefingSkeleton />
      </div>
    );
  }

  if (!briefing && !generating) {
    return (
      <div className="mx-auto px-6 lg:px-10" style={{ maxWidth: 860 }}>
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        <EmptyState onGenerate={handleGenerate} loading={generating} />
      </div>
    );
  }

  if (generating && !briefing) {
    return (
      <div className="mx-auto px-6 lg:px-10" style={{ maxWidth: 860 }}>
        <BriefingSkeleton />
        <div className="mt-4 text-center text-sm text-brand-300">
          Your AI team is compiling the briefing... This takes about 10 seconds.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto px-6 lg:px-10 pb-20 min-h-screen" style={{ maxWidth: 860, background: 'var(--bg-1, #0A0A0F)' }}>
      {/* Error banner */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Greeting header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-1">
          {getGreetingIcon()}
          <span className="text-xs font-medium uppercase tracking-wider text-brand-300">
            {formatDate()}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-white">
          {getGreeting()}
          {displayName ? `, ${displayName}` : ''}.
        </h1>
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-1.5 text-xs text-brand-300 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={generating ? 'animate-spin' : ''} />
            {generating ? 'Updating...' : 'Refresh briefing'}
          </button>
        </div>
      </div>

      {/* Agent errors (collapsed) */}
      {briefing && briefing.errors && briefing.errors.length > 0 && (
        <div className="mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
          <span className="font-medium">Note:</span>{' '}
          {briefing.errors.length === 1
            ? '1 agent could not contribute.'
            : `${briefing.errors.length} agents could not contribute.`}
        </div>
      )}

      {/* TODAY'S PRIORITIES */}
      {briefing && briefing.priorities.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-300 mb-4">
            Today&apos;s Priorities
          </h2>
          <div className="space-y-3">
            {briefing.priorities.map((p, i) => {
              const color = getAgentColor(p.agent);
              return (
                <Link
                  key={`${p.agent}-${i}`}
                  href={p.link}
                  className="block no-underline group"
                >
                  <div
                    className="rounded-xl p-4 transition-all group-hover:-translate-y-[1px]"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      boxShadow: 'none',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg font-semibold text-brand-400 mt-0.5 w-6 text-right shrink-0">
                        {i + 1}.
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: color }}
                          />
                          <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color }}>
                            {p.agentLabel}
                          </span>
                        </div>
                        <p className="text-sm text-white/90 leading-relaxed">
                          {p.text}
                        </p>
                      </div>
                      <ArrowRight
                        size={14}
                        className="text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1"
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* THIS WEEK */}
      {briefing && briefing.thisWeek.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-300 mb-4">
            This Week
          </h2>
          <div className="space-y-3">
            {briefing.thisWeek.map((w) => {
              const color = getAgentColor(w.agent);
              return (
                <div
                  key={w.agent}
                  className="rounded-xl p-4"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: color }}
                    />
                    <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color }}>
                      {w.agentLabel}
                    </span>
                  </div>
                  <ul className="space-y-1.5 ml-4">
                    {w.items.map((item, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-white/80 leading-relaxed flex items-start gap-2"
                      >
                        <span className="text-brand-400 mt-1 shrink-0">-</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* NEEDS YOUR INPUT */}
      {briefing && briefing.needsInput.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-300 mb-4">
            Needs Your Input
          </h2>
          <div className="space-y-3">
            {briefing.needsInput.map((item, i) => {
              const color = getAgentColor(item.agent);
              return (
                <div
                  key={`${item.agent}-${i}`}
                  className="rounded-xl p-4"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: color }}
                        />
                        <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color }}>
                          {item.agentLabel}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-white/90 mb-1">
                        {item.title}
                      </p>
                      {item.context && (
                        <p className="text-xs text-brand-200/70 leading-relaxed">
                          {item.context}
                        </p>
                      )}
                    </div>
                    <Link
                      href={item.link}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all no-underline"
                      style={{
                        background: `${color}18`,
                        color,
                        border: `1px solid ${color}30`,
                      }}
                    >
                      {getActionIcon(item.type)}
                      {getActionLabel(item.type)}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Empty briefing state */}
      {briefing &&
        briefing.priorities.length === 0 &&
        briefing.thisWeek.length === 0 &&
        briefing.needsInput.length === 0 && (
          <div className="text-center py-12 text-brand-200">
            <p className="text-sm">
              Your team had nothing specific to report today. Try refreshing later, or
              chat with your team to give them more context to work with.
            </p>
          </div>
        )}
    </div>
  );
}
