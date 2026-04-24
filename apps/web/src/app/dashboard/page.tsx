"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Info } from "lucide-react";
import type { DashboardSummary } from "@/app/api/dashboard/summary/route";
import type { HoursSavedResponse } from "@/app/api/stats/hours-saved/route";
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
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden z-0">
      <div
        className="absolute"
        style={{
          top: "-20%",
          left: "-10%",
          width: "60%",
          height: "80%",
          background:
            "radial-gradient(circle at 30% 30%, rgba(159,78,243,0.16) 0%, transparent 60%)",
          filter: "blur(40px)",
          animation: "blob-a 22s ease-in-out infinite",
        }}
      />
      <div
        className="absolute"
        style={{
          bottom: "-20%",
          right: "-10%",
          width: "55%",
          height: "70%",
          background:
            "radial-gradient(circle at 60% 60%, rgba(124,58,237,0.12) 0%, transparent 60%)",
          filter: "blur(50px)",
          animation: "blob-b 28s ease-in-out infinite",
        }}
      />
    </div>
  );
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

function MicroStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div
        className="font-mono font-medium leading-none tracking-[-0.02em]"
        style={{ fontSize: 22, color: "var(--fg-1)" }}
      >
        {value}
      </div>
      <div
        className="text-[11px] uppercase tracking-[0.08em] mt-1"
        style={{ color: "var(--fg-3)" }}
      >
        {label}
      </div>
    </div>
  );
}

function MicroDivider() {
  return <div className="w-px self-stretch" style={{ background: "var(--line-2)" }} />;
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
      <Card elevation={0} className="p-5">
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
          <div className="text-[13px] py-2" style={{ color: "var(--fg-3)" }}>
            Loading…
          </div>
        ) : !data || data.hours_saved_total === 0 ? (
          <div className="text-[13px] py-1 leading-[1.55]" style={{ color: "var(--fg-3)" }}>
            Start chatting with your team to see hours saved. Estimates update in real time.
          </div>
        ) : (
          <div>
            <div
              className="font-mono font-medium leading-none tracking-[-0.02em] mt-1"
              style={{ fontSize: 32, color: "var(--fg-1)" }}
            >
              {formatHoursSaved(data.hours_saved_total)}
            </div>
            {data.first_event_at && (
              <div
                className="text-[11px] mt-2"
                style={{ color: "var(--fg-3)" }}
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
          background: "var(--bg-2)",
          boxShadow: "0 0 0 1px var(--line-2)",
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
      style={{ background: "var(--hero-gradient-dashboard)" }}
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

        <h1 className="display" style={{ margin: "8px 0 16px", maxWidth: 980 }}>
          {greeting}.<br />
          <span style={{ color: "var(--fg-3)" }}>Your team moved </span>
          <span style={{ color: "var(--brand-tint)" }}>
            {loading ? "—" : tasksCompleted.toLocaleString("en-US")}
          </span>
          <span style={{ color: "var(--fg-3)" }}> things forward.</span>
        </h1>

        {/* ————— HERO + ASYMMETRIC STATS ————— */}
        <div
          className="grid gap-8 mt-14 mb-20"
          style={{
            gridTemplateColumns: "minmax(0, 1.45fr) minmax(0, 1fr)",
          }}
        >
          {/* Team Status */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.slow, ease: EASE.entrance }}
            className="relative overflow-hidden rounded-[20px] p-8 flex flex-col"
            style={{
              background:
                "linear-gradient(135deg, var(--bg-plum-1) 0%, var(--bg-2) 60%)",
              boxShadow: "var(--elev-2)",
              minHeight: 360,
            }}
          >
            <div
              aria-hidden
              className="absolute pointer-events-none"
              style={{
                top: -60,
                right: -40,
                width: 340,
                height: 340,
                background: "radial-gradient(circle, rgba(159,78,243,0.2) 0%, transparent 60%)",
                filter: "blur(20px)",
                animation: "hero-breathe 7s ease-in-out infinite",
              }}
            />
            <div className="relative flex-1">
              <div className="flex items-center gap-2.5 mb-6">
                <span
                  className="font-mono text-[11px] tracking-[0.14em]"
                  style={{ color: "var(--brand-tint)" }}
                >
                  TEAM STATUS
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {ARCHETYPE_LIST.map((arc) => {
                  const name = archetypeNames[KEY_TO_SLUG[arc.key]];
                  return (
                    <Link
                      key={arc.key}
                      href={`/dashboard/team/${KEY_TO_SLUG[arc.key]}`}
                      className="flex items-center gap-3 rounded-[12px] p-3 transition-colors"
                      style={{
                        background: "var(--bg-3)",
                        boxShadow: "0 0 0 1px var(--line-1)",
                      }}
                    >
                      <ArchetypeMark arc={arc} size={28} />
                      <div className="min-w-0 flex-1">
                        <div
                          className="text-[13px] font-medium truncate"
                          style={{ color: "var(--fg-1)" }}
                        >
                          {name ?? (
                            <span style={{ color: "var(--fg-4)", fontStyle: "italic" }}>
                              {arc.role}
                            </span>
                          )}
                        </div>
                        <div
                          className="text-[11px] font-mono uppercase tracking-[0.08em]"
                          style={{ color: arc.color }}
                        >
                          {arc.short}
                        </div>
                      </div>
                      <span
                        className="inline-block rounded-full flex-shrink-0"
                        style={{
                          width: 6,
                          height: 6,
                          background: arc.color,
                          boxShadow: `0 0 6px ${arc.color}`,
                        }}
                      />
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="relative flex gap-5 mt-7 flex-wrap items-center">
              <MicroStat
                value={String(ARCHETYPE_LIST.filter((a) => archetypeNames[KEY_TO_SLUG[a.key]]).length)}
                label="named"
              />
              <MicroDivider />
              <MicroStat value={String(ARCHETYPE_LIST.length)} label="directors" />
              <MicroDivider />
              <MicroStat value={loading ? "—" : String(pendingApprovals)} label="pending" />
              <Link
                href="/dashboard/team"
                className="ml-auto inline-flex items-center gap-1.5 font-medium text-[13px]"
                style={{ color: "var(--brand-tint)" }}
              >
                View team
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m13 5 7 7-7 7" />
                </svg>
              </Link>
            </div>
          </motion.div>

          {/* Right column — approvals + week summary + hours saved */}
          <div className="flex flex-col gap-5">
            <Link href="/dashboard/inbox">
              <Card
                elevation={1}
                className="relative overflow-hidden p-6 cursor-pointer group transition-transform hover:-translate-y-[1px]"
                style={{ boxShadow: "0 0 0 1px var(--warn-line)" }}
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
                      "linear-gradient(90deg, transparent, var(--warn-tint))",
                    animation: "amber-shift 4s ease-in-out infinite",
                    opacity: 0.6,
                  }}
                />
                <div className="relative">
                  <span className="eyebrow" style={{ color: "var(--warn)" }}>
                    NEEDS YOU
                  </span>
                  <div className="flex items-baseline gap-3.5 mt-1.5">
                    <span
                      className="font-mono font-medium leading-[0.9] tracking-[-0.03em]"
                      style={{ fontSize: 72, color: "var(--fg-1)" }}
                    >
                      {loading ? "—" : pendingApprovals}
                    </span>
                    <span style={{ color: "var(--fg-2)", fontSize: 18 }}>
                      approvals pending
                    </span>
                  </div>
                  <div
                    className="mt-2.5 text-[13px]"
                    style={{ color: "var(--fg-3)" }}
                  >
                    <span style={{ color: "var(--warn)" }}>Review now →</span>
                  </div>
                </div>
              </Card>
            </Link>

            <Card elevation={0} className="p-5">
              <span className="eyebrow">THIS WEEK</span>
              <div className="mt-3.5 flex flex-col gap-2.5">
                {loading ? (
                  <div className="text-[13px] py-2" style={{ color: "var(--fg-3)" }}>
                    Loading…
                  </div>
                ) : tasksCompleted === 0 ? (
                  <div className="text-[13px] py-2" style={{ color: "var(--fg-3)" }}>
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
              style={{ fontSize: 28 }}
            >
              Your team
            </h2>
            <span className="font-mono text-[12px]" style={{ color: "var(--fg-3)" }}>
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
                style={{ fontSize: 28 }}
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
              <div
                className="py-4 text-[13px]"
                style={{ color: "var(--fg-3)" }}
              >
                No events today.{" "}
                <Link
                  href="/dashboard/integrations"
                  style={{ color: "var(--brand-tint)" }}
                >
                  Connect your calendar →
                </Link>
              </div>
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
