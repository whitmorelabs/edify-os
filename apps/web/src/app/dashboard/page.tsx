"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Info } from "lucide-react";
import type { DashboardSummary } from "@/app/api/dashboard/summary/route";
import type { HoursSavedResponse } from "@/app/api/stats/hours-saved/route";
import type { TodayEventsResponse } from "@/app/api/integrations/google/today-events/route";
import type { TokenUsageSummary } from "@/app/api/admin/usage/tokens/route";
import type { AgentRoleSlug } from "@/lib/agent-colors";
import {
  ARCHETYPES,
  ARCHETYPE_LIST,
  ActivityRow,
  ArchetypeMark,
  Card,
  Dialog,
  type Archetype,
  type ArchetypeKey,
} from "@/components/ui";
import { DURATION, EASE } from "@/lib/motion";
import { useArchetypeNames } from "@/hooks/useArchetypeNames";

/* --------------------------------------------------------------------- */
/* Slug → ArchetypeKey mapping                                            */
/* --------------------------------------------------------------------- */

const SLUG_TO_KEY: Record<AgentRoleSlug, ArchetypeKey> = {
  executive_assistant: "exec",
  events_director: "events",
  development_director: "dev",
  marketing_director: "marketing",
  programs_director: "programs",
  hr_volunteer_coordinator: "hr",
};

/** Reverse mapping: ArchetypeKey → database slug, for name lookups */
const KEY_TO_SLUG: Record<ArchetypeKey, AgentRoleSlug> = {
  exec: "executive_assistant",
  events: "events_director",
  dev: "development_director",
  marketing: "marketing_director",
  programs: "programs_director",
  hr: "hr_volunteer_coordinator",
};

/* --------------------------------------------------------------------- */
/* Helpers                                                                 */
/* --------------------------------------------------------------------- */

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

function verbFromAction(action: string): { verb: string; rest: string } {
  // Extract a leading past-tense verb from an action string, or fall back.
  const match = action.match(/^(\w+(?:ed|n))\s+(.+)$/i);
  if (match) return { verb: match[1], rest: match[2] };
  const first = action.split(" ")[0];
  const rest = action.slice(first.length).trim();
  return { verb: first || "Did", rest };
}

/* --------------------------------------------------------------------- */
/* Hours-saved formatting                                                  */
/* --------------------------------------------------------------------- */

function formatHoursSaved(hours: number): string {
  const totalMinutes = hours * 60;
  if (totalMinutes < 60) {
    return `${Math.round(totalMinutes)} min saved`;
  }
  if (hours < 100) {
    return `${hours.toFixed(1)} hrs saved`;
  }
  return `${Math.round(hours)} hrs saved`;
}

function formatFirstEventDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

/* --------------------------------------------------------------------- */
/* Ambient background (plum blobs)                                         */
/* --------------------------------------------------------------------- */

function AmbientBG() {
  return null;
}

/* --------------------------------------------------------------------- */
/* Presentational subcomponents                                             */
/* --------------------------------------------------------------------- */

function NameSlot({ big = false, name }: { big?: boolean; name?: string }) {
  if (name) {
    return (
      <span style={{ fontSize: big ? undefined : "inherit" }}>{name}</span>
    );
  }
  return (
    <span
      className="italic font-normal"
      style={{
        color: "var(--fg-4)",
        fontSize: big ? undefined : "inherit",
      }}
    >
      — unnamed —
    </span>
  );
}

function MiniBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 200);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div>
      <div className="flex justify-between text-[12px] mb-1" style={{ color: "var(--fg-3)" }}>
        <span>{label}</span>
        <span className="font-mono" style={{ color: "var(--fg-2)" }}>
          {value}
        </span>
      </div>
      <div
        className="h-[6px] rounded-full overflow-hidden"
        style={{
          background: "var(--bg-1)",
          boxShadow: "inset 0 0 0 1px var(--line-1)",
        }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${width}%`,
            background: color,
            boxShadow: `0 0 8px ${color}66`,
            transition: "width 900ms var(--ease-entrance)",
          }}
        />
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- */
/* How-we-calculate dialog                                                 */
/* --------------------------------------------------------------------- */

function HowWeCalculateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title="How we estimate hours saved" maxWidth={480}>
      <p
        className="leading-[1.6] text-[14px] mb-4"
        style={{ color: "var(--fg-2)" }}
      >
        Every time your AI team completes a task — drafting an email, researching a grant,
        building a deck — we add a conservative time estimate to your running total. The
        numbers are based on typical knowledge-worker times for the same task without AI.
      </p>
      <div
        className="rounded-[10px] p-4 text-[13px] leading-[1.7]"
        style={{ background: "var(--bg-1)", color: "var(--fg-2)" }}
      >
        <p className="font-medium mb-2" style={{ color: "var(--fg-1)" }}>Examples</p>
        <ul className="list-none p-0 m-0 flex flex-col gap-1">
          <li>• Drafting an email: <strong>15 min</strong></li>
          <li>• Searching for grants: <strong>45 min</strong></li>
          <li>• Building a presentation deck: <strong>60 min</strong></li>
          <li>• Creating a Google Doc from scratch: <strong>20 min</strong></li>
        </ul>
      </div>
      <p
        className="mt-4 text-[12px] leading-[1.55]"
        style={{ color: "var(--fg-4)" }}
      >
        This is an honest approximation, not a timesheet. Real value varies. We lean
        conservative so you aren&apos;t surprised.
      </p>
    </Dialog>
  );
}

/* --------------------------------------------------------------------- */
/* Hours-saved stat card                                                   */
/* --------------------------------------------------------------------- */

function HoursSavedCard({
  data,
  loading,
}: {
  data: HoursSavedResponse | null;
  loading: boolean;
}) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      <HowWeCalculateDialog open={showInfo} onClose={() => setShowInfo(false)} />
      <Card elevation={0} className="p-5" style={{ background: "#ffffff", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div className="flex items-center justify-between mb-1">
          <span className="eyebrow">HOURS SAVED</span>
          <button
            aria-label="How we calculate hours saved"
            onClick={() => setShowInfo(true)}
            className="flex items-center justify-center rounded-full transition-colors"
            style={{
              color: "var(--fg-3)",
              width: 24,
              height: 24,
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--fg-1)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--fg-3)";
            }}
          >
            <Info size={14} />
          </button>
        </div>
        {loading ? (
          <div className="text-[13px] py-2" style={{ color: "#6b7280" }}>
            Loading…
          </div>
        ) : !data || data.hours_saved_total === 0 ? (
          <div className="text-[13px] py-1 leading-[1.55]" style={{ color: "#6b7280" }}>
            Start chatting with your team to see hours saved. Estimates update in real time.
          </div>
        ) : (
          <div>
            <div
              className="font-mono font-medium leading-none tracking-[-0.02em] mt-1"
              style={{ fontSize: 32, color: "#111827" }}
            >
              {formatHoursSaved(data.hours_saved_total)}
            </div>
            {data.first_event_at && (
              <div
                className="text-[11px] mt-2"
                style={{ color: "#6b7280" }}
              >
                since {formatFirstEventDate(data.first_event_at)}
              </div>
            )}
          </div>
        )}
      </Card>
    </>
  );
}

function TeamCard({ arc, index, name }: { arc: Archetype; index: number; name?: string }) {
  const delay = Math.min(index, 6) * 0.06 + 0.1;
  const slug = KEY_TO_SLUG[arc.key];
  return (
    <Link href={`/dashboard/team/${slug}`} className="block no-underline">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.slow, ease: EASE.entrance, delay }}
        className="relative overflow-hidden rounded-[14px] cursor-pointer group transition-transform hover:-translate-y-[2px]"
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)",
          border: "1px solid rgba(229,231,235,0.6)",
          minHeight: 130,
          padding: 18,
        }}
      >
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: -30,
            right: -30,
            width: 110,
            height: 110,
            background: `radial-gradient(circle, ${arc.color}22, transparent 70%)`,
            animation: `blob-a ${5 + index * 0.4}s ease-in-out infinite`,
          }}
        />
        <div className="relative flex flex-col gap-2.5">
          <ArchetypeMark arc={arc} size={36} />
          <div>
            <div
              className="font-mono text-[11px] uppercase tracking-[0.1em]"
              style={{ color: arc.color }}
            >
              {arc.short}
            </div>
            <div className="text-[14px] font-medium mt-0.5" style={{ color: "var(--fg-2)" }}>
              <NameSlot name={name} />
            </div>
          </div>
          <div
            className="mt-auto flex items-center gap-1.5 text-[12px]"
            style={{ color: "var(--fg-3)" }}
          >
            <span
              className="inline-block rounded-full"
              style={{
                width: 4,
                height: 4,
                background: arc.color,
                boxShadow: `0 0 6px ${arc.color}`,
              }}
            />
            <span>idle</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}


/* --------------------------------------------------------------------- */
/* Main page                                                               */
/* --------------------------------------------------------------------- */

export default function DashboardHome() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoursSaved, setHoursSaved] = useState<HoursSavedResponse | null>(null);
  const [hoursSavedLoading, setHoursSavedLoading] = useState(true);
  const [todayEvents, setTodayEvents] = useState<TodayEventsResponse | null>(null);
  const [todayLoading, setTodayLoading] = useState(true);
  const [tokenUsage, setTokenUsage] = useState<TokenUsageSummary | null>(null);
  const [tokenUsageLoading, setTokenUsageLoading] = useState(true);
  const { names: archetypeNames } = useArchetypeNames();

  useEffect(() => {
    fetch("/api/dashboard/summary")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: DashboardSummary | null) => setSummary(data))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/stats/hours-saved")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: HoursSavedResponse | null) => setHoursSaved(data))
      .catch(() => setHoursSaved(null))
      .finally(() => setHoursSavedLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/integrations/google/today-events")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: TodayEventsResponse | null) => setTodayEvents(data))
      .catch(() => setTodayEvents(null))
      .finally(() => setTodayLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/admin/usage/tokens?days=30")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: TokenUsageSummary | null) => setTokenUsage(data))
      .catch(() => setTokenUsage(null))
      .finally(() => setTokenUsageLoading(false));
  }, []);

  const now = useMemo(() => new Date(), []);
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const monthDay = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const week = `WEEK ${Math.ceil(
    ((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86_400_000 + 1) / 7,
  )}`;
  const clock = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const otherDirectors = ARCHETYPE_LIST;

  const tasksCompleted = summary?.stats.tasksCompleted ?? 0;
  const pendingApprovals = summary?.stats.pendingApprovals ?? 0;

  return (
    <div
      className="relative isolate min-h-full"
      style={{ background: "transparent" }}
    >
      <AmbientBG />
      <div
        className="relative z-10 mx-auto px-6 lg:px-10"
        style={{ maxWidth: 1280 }}
      >
        {/* ————— EDITORIAL HEADER ————— */}
        <div className="flex items-baseline gap-5 flex-wrap mb-2">
          <span className="eyebrow">
            {dayName.toUpperCase()} · {monthDay.toUpperCase()}
          </span>
          <span
            className="font-mono text-[12px]"
            style={{ color: "var(--fg-3)" }}
          >
            {week} · {clock}
          </span>
          <span
            className="ml-auto inline-flex items-center gap-2 font-mono text-[11px]"
            style={{ color: "var(--fg-3)" }}
          >
            <span
              className="inline-block rounded-full"
              style={{
                width: 6,
                height: 6,
                background: "var(--success)",
                boxShadow: "0 0 8px var(--success)",
                animation: "active-pulse 2s ease-in-out infinite",
              }}
            />
            ALL DIRECTORS ACTIVE
          </span>
        </div>

        <h1 className="display" style={{ margin: "8px 0 16px", maxWidth: 980, color: "#111827" }}>
          {greeting}.<br />
          <span style={{ color: "#6b7280" }}>Your team moved </span>
          <span style={{ color: "var(--brand-purple)" }}>
            {loading ? "—" : tasksCompleted.toLocaleString("en-US")}
          </span>
          <span style={{ color: "#6b7280" }}> things forward.</span>
        </h1>

        {/* ————— HERO STATS ————— */}
        <div
          className="grid gap-5 mt-14 mb-20"
          style={{ gridTemplateColumns: "3fr 2fr" }}
        >
          {/* Left: API Usage card */}
          <Card
            elevation={0}
            className="p-6"
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <span className="eyebrow">API USAGE</span>
            {tokenUsageLoading ? (
              <div className="text-[13px] py-2 mt-2" style={{ color: "#6b7280" }}>
                Loading…
              </div>
            ) : !tokenUsage ? (
              <div className="py-2 mt-2">
                <div className="text-[13px]" style={{ color: "#6b7280" }}>
                  No usage data yet.
                </div>
                <button
                  className="mt-3 text-[12px] font-medium px-3 py-1.5 rounded-md"
                  style={{
                    color: "var(--brand-purple)",
                    border: "1px solid var(--brand-purple)",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    fetch("/api/admin/usage/backfill", { method: "POST" })
                      .then((r) => r.json())
                      .then((d) => {
                        if (d.backfilled > 0) {
                          // Refetch token usage
                          fetch("/api/admin/usage/tokens?days=30")
                            .then((r) => r.ok ? r.json() : null)
                            .then((data: TokenUsageSummary | null) => setTokenUsage(data));
                        }
                      });
                  }}
                >
                  Sync historical usage
                </button>
              </div>
            ) : (
              <div>
                <div
                  className="font-mono font-medium leading-none tracking-[-0.03em] mt-2"
                  style={{ fontSize: 56, color: "var(--brand-purple)" }}
                >
                  ${tokenUsage.estimatedCostUsd.toFixed(2)}
                </div>
                <div
                  className="text-[13px] mt-1"
                  style={{ color: "#6b7280" }}
                >
                  estimated cost this month
                </div>
                <div
                  className="mt-5 pt-5 flex flex-col gap-2"
                  style={{ borderTop: "1px solid #e5e7eb" }}
                >
                  <div className="flex justify-between text-[13px]">
                    <span style={{ color: "#6b7280" }}>Input tokens</span>
                    <span className="font-mono" style={{ color: "#111827" }}>
                      {tokenUsage.totalInputTokens.toLocaleString("en-US")}
                    </span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span style={{ color: "#6b7280" }}>Output tokens</span>
                    <span className="font-mono" style={{ color: "#111827" }}>
                      {tokenUsage.totalOutputTokens.toLocaleString("en-US")}
                    </span>
                  </div>
                  <div
                    className="flex justify-between text-[13px] pt-2"
                    style={{ borderTop: "1px solid #f3f4f6" }}
                  >
                    <span style={{ color: "#374151", fontWeight: 500 }}>Total tokens</span>
                    <span className="font-mono font-medium" style={{ color: "#111827" }}>
                      {tokenUsage.grandTotal.toLocaleString("en-US")}
                    </span>
                  </div>
                </div>
                <button
                  className="mt-4 text-[11px] font-medium px-3 py-1 rounded-md w-full"
                  style={{
                    color: "#6b7280",
                    border: "1px solid #e5e7eb",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    fetch("/api/admin/usage/backfill", { method: "POST" })
                      .then((r) => r.json())
                      .then(() => {
                        fetch("/api/admin/usage/tokens?days=30")
                          .then((r) => r.ok ? r.json() : null)
                          .then((data: TokenUsageSummary | null) => setTokenUsage(data));
                      });
                  }}
                >
                  Sync historical usage
                </button>
              </div>
            )}
          </Card>

          {/* Right: 3 smaller cards stacked */}
          <div className="flex flex-col gap-5">
            <Link href="/dashboard/inbox" className="block no-underline flex-1">
              <Card
                elevation={1}
                className="relative overflow-hidden p-6 cursor-pointer group transition-transform hover:-translate-y-[1px] h-full"
                style={{
                  background: "#ffffff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(245,181,68,0.4)",
                  border: "1px solid #e5e7eb",
                }}
              >
                <div
                  aria-hidden
                  className="absolute pointer-events-none"
                  style={{
                    top: 0,
                    right: 0,
                    width: 160,
                    height: "100%",
                    background:
                      "linear-gradient(90deg, transparent, rgba(245,181,68,0.08))",
                    animation: "amber-shift 4s ease-in-out infinite",
                    opacity: 0.6,
                  }}
                />
                <div className="relative">
                  <span className="eyebrow" style={{ color: "var(--warn)" }}>
                    NEEDS YOU
                  </span>
                  <div className="flex items-baseline gap-3 mt-1.5">
                    <span
                      className="font-mono font-medium leading-[0.9] tracking-[-0.03em]"
                      style={{ fontSize: 52, color: "#111827" }}
                    >
                      {loading ? "—" : pendingApprovals}
                    </span>
                    <span style={{ color: "#6b7280", fontSize: 15 }}>
                      approvals pending
                    </span>
                  </div>
                  <div
                    className="mt-2.5 text-[13px]"
                    style={{ color: "#9ca3af" }}
                  >
                    <span style={{ color: "var(--warn)" }}>Review now →</span>
                  </div>
                </div>
              </Card>
            </Link>

            <Card elevation={0} className="p-5 flex-1" style={{ background: "#ffffff", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <span className="eyebrow">THIS WEEK</span>
              <div className="mt-3.5 flex flex-col gap-2.5">
                {loading ? (
                  <div className="text-[13px] py-2" style={{ color: "#6b7280" }}>
                    Loading…
                  </div>
                ) : tasksCompleted === 0 ? (
                  <div className="text-[13px] py-2" style={{ color: "#6b7280" }}>
                    No activity yet — start a conversation to kick things off.
                  </div>
                ) : (
                  <MiniBar
                    label="Tasks done"
                    value={tasksCompleted}
                    max={tasksCompleted || 1}
                    color="var(--brand-purple)"
                  />
                )}
              </div>
            </Card>

            <HoursSavedCard data={hoursSaved} loading={hoursSavedLoading} />
          </div>
        </div>

        {/* ————— REST OF TEAM ————— */}
        <div className="mb-8">
          <div className="flex items-baseline gap-4">
            <h2
              className="font-medium tracking-[-0.015em] m-0"
              style={{ fontSize: 28, color: "#111827" }}
            >
              Your team
            </h2>
            <span className="font-mono text-[12px]" style={{ color: "#6b7280" }}>
              {otherDirectors.length} directors · idle but ready
            </span>
          </div>
        </div>
        <div
          className="grid gap-6 mb-20"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
        >
          {otherDirectors.map((arc, i) => (
            <TeamCard
              key={arc.key}
              arc={arc}
              index={i}
              name={archetypeNames[KEY_TO_SLUG[arc.key]]}
            />
          ))}
        </div>

        {/* ————— ACTIVITY ————— */}
        <div
          className="grid gap-16 mt-10 pb-20"
          style={{ gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)" }}
        >
          <div>
            <div className="flex items-baseline justify-between mb-4">
              <h2
                className="font-medium tracking-[-0.015em] m-0"
                style={{ fontSize: 28, color: "#111827" }}
              >
                Since you were gone
              </h2>
              <Link
                href="/dashboard/tasks"
                className="text-[13px]"
                style={{ color: "var(--brand-tint)" }}
              >
                View all →
              </Link>
            </div>
            <div className="flex flex-col">
              {loading ? (
                <div
                  className="text-[14px] py-8"
                  style={{ color: "var(--fg-3)" }}
                >
                  Loading activity…
                </div>
              ) : !summary || summary.recentActivity.length === 0 ? (
                <Card elevation={0} className="p-8">
                  <div className="text-[14px]" style={{ color: "var(--fg-3)" }}>
                    Your team hasn&apos;t done anything yet.{" "}
                    <Link
                      href="/dashboard/team"
                      className="font-medium"
                      style={{ color: "var(--brand-tint)" }}
                    >
                      Start a conversation to kick things off.
                    </Link>
                  </div>
                </Card>
              ) : (
                summary.recentActivity.map((item, i) => {
                  const key = SLUG_TO_KEY[item.agent];
                  if (!key) return null;
                  const arc = ARCHETYPES[key];
                  const { verb, rest } = verbFromAction(item.action);
                  return (
                    <ActivityRow
                      key={item.id}
                      arc={arc}
                      verb={verb}
                      headline={rest}
                      time={formatRelativeTime(item.time)}
                      badge={
                        item.status === "awaiting_approval"
                          ? "needs review"
                          : undefined
                      }
                      index={i}
                    />
                  );
                })
              )}
            </div>
          </div>

          {/* Right rail — today's schedule */}
          <aside className="sticky top-24 self-start">
            <span className="eyebrow">TODAY</span>
            <div className="mt-3.5 flex flex-col gap-1">
              {todayLoading ? (
                <div className="py-4 text-[13px]" style={{ color: "var(--fg-3)" }}>
                  Loading…
                </div>
              ) : !todayEvents || (!todayEvents.connected && !todayEvents.authError) ? (
                <div className="py-4 text-[13px]" style={{ color: "var(--fg-3)" }}>
                  No events today.{" "}
                  <Link
                    href="/dashboard/integrations"
                    style={{ color: "var(--brand-tint)" }}
                  >
                    Connect your calendar →
                  </Link>
                </div>
              ) : todayEvents.authError ? (
                <div className="py-4 text-[13px]" style={{ color: "var(--fg-3)" }}>
                  Calendar needs to be reconnected.{" "}
                  <Link
                    href="/dashboard/integrations"
                    style={{ color: "var(--brand-tint)" }}
                  >
                    Reconnect →
                  </Link>
                </div>
              ) : todayEvents.events.length === 0 ? (
                <div className="py-4 text-[13px]" style={{ color: "var(--fg-3)" }}>
                  Nothing on the calendar today.
                </div>
              ) : (
                todayEvents.events.map((event) => {
                  const timeLabel = event.allDay
                    ? "All day"
                    : event.startTime
                    ? new Date(event.startTime).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })
                    : null;
                  return (
                    <div
                      key={event.id}
                      className="flex gap-3 py-2.5 border-b last:border-b-0"
                      style={{ borderColor: "var(--line-1)" }}
                    >
                      {timeLabel && (
                        <span
                          className="font-mono text-[11px] pt-0.5 flex-shrink-0"
                          style={{ color: "var(--fg-4)", minWidth: 52 }}
                        >
                          {timeLabel}
                        </span>
                      )}
                      <span className="text-[13px]" style={{ color: "var(--fg-2)" }}>
                        {event.summary}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-8">
              <span className="eyebrow">GENTLE REMINDERS</span>
              <ul
                className="mt-3 p-0 list-none flex flex-col gap-2.5 text-[13px]"
                style={{ color: "var(--fg-2)" }}
              >
                {ARCHETYPE_LIST.filter(
                  (a) => !archetypeNames[KEY_TO_SLUG[a.key]]
                ).length > 0 ? (
                  <li className="flex gap-2.5">
                    <span style={{ color: "var(--brand-purple)" }}>·</span>
                    <span>
                      {ARCHETYPE_LIST.filter(
                        (a) => !archetypeNames[KEY_TO_SLUG[a.key]]
                      ).length === ARCHETYPE_LIST.length
                        ? "Your team members don't have names yet."
                        : `${ARCHETYPE_LIST.filter(
                            (a) => !archetypeNames[KEY_TO_SLUG[a.key]]
                          )
                            .map((a) => a.role)
                            .join(", ")} still need a name.`}{" "}
                      <Link
                        href="/dashboard/team"
                        style={{ color: "var(--brand-tint)" }}
                      >
                        Name them →
                      </Link>
                    </span>
                  </li>
                ) : (
                  <li className="flex gap-2.5">
                    <span style={{ color: "var(--brand-purple)" }}>·</span>
                    All team members are named and ready.
                  </li>
                )}
                {pendingApprovals > 0 && (
                  <li className="flex gap-2.5">
                    <span style={{ color: "var(--brand-purple)" }}>·</span>
                    <span>
                      {pendingApprovals} item
                      {pendingApprovals !== 1 ? "s" : ""} waiting for your
                      approval.{" "}
                      <Link
                        href="/dashboard/inbox"
                        style={{ color: "var(--brand-tint)" }}
                      >
                        Review →
                      </Link>
                    </span>
                  </li>
                )}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
