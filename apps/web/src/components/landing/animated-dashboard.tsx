"use client";

/**
 * AnimatedDashboard — the landing hero's "live mini-dashboard" preview.
 * Mirrors the real Edify-OS dashboard structure:
 *   - Browser chrome with edify.app/dashboard URL
 *   - Sidebar strip with nav icons (Dashboard, Briefing, Inbox, etc.)
 *   - Main content: light bg matching real dashboard (bg-gray-50 / white cards)
 *   - Left panel: Development Director chat (grant research — real use case)
 *   - Right panel: stat cards matching real dashboard (Hours Saved, Needs Review, approval card)
 *
 * Animation loop (10s):
 *   0.3s: User bubble pops in
 *   1.4s: Director typing indicator ("researching…")
 *   2.9s: Agent reply bubble
 *   3.8s: File card arrives with amber glow (dev color)
 *   5.1s: Approval card drops into rail, counter +1
 *   6.2s: Hours-saved counter ticks +0.5
 *   8.8s: Fade out
 *   10s:  Loop
 *
 * Colors match ARCHETYPES in apps/web/src/components/ui/archetypes.tsx:
 *   dev (Development Director): #F59E5C
 *   exec (Executive Assistant): #9F4EF3
 *   events: #F472B6, marketing: #7DD3FC, programs: #4ADE80, hr: #FCD34D
 */

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

// Archetype colors from apps/web/src/components/ui/archetypes.tsx
const DEV_COLOR = "#F59E5C";   // Development Director
const BRAND_PURPLE = "#9F4EF3"; // brand purple / exec color

const SIDEBAR_ARCHETYPE_DOTS = [
  BRAND_PURPLE,  // exec
  "#F472B6",     // events
  DEV_COLOR,     // dev
  "#7DD3FC",     // marketing
  "#4ADE80",     // programs
  "#FCD34D",     // hr
];

export function AnimatedDashboard() {
  const reduced = useReducedMotion();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (reduced) {
      setTick(500); // freeze mid-loop with everything visible
      return;
    }
    const id = setInterval(() => setTick((t) => (t + 1) % 1000), 10);
    return () => clearInterval(id);
  }, [reduced]);

  const t = tick / 100;
  const showUser = t >= 0.3;
  const showThinking = t >= 1.4 && t < 3.0;
  const showReply = t >= 2.9;
  const showFile = t >= 3.8;
  const showApproval = t >= 5.1;
  const hoursTick = t >= 6.2;
  const fadeAll = t >= 8.8;

  const op = (visible: boolean) =>
    visible ? (fadeAll ? Math.max(0, 1 - (t - 8.8) / 1.0) : 1) : 0;

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        aspectRatio: "16 / 10",
        borderRadius: 20,
        background: "#F9FAFB", // matches real dashboard bg-gray-50
        boxShadow:
          "0 40px 120px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.08), 0 0 80px rgba(159,78,243,0.12)",
      }}
    >
      {/* browser chrome */}
      <div
        className="flex items-center gap-2"
        style={{
          padding: "8px 12px",
          borderBottom: "1px solid #E5E7EB",
          background: "#FFFFFF",
        }}
      >
        <div className="flex gap-1.5">
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
            <span
              key={c}
              style={{ width: 8, height: 8, borderRadius: 9999, background: c, opacity: 0.7 }}
            />
          ))}
        </div>
        <div
          className="ml-2.5 inline-flex items-center gap-1.5 font-mono"
          style={{ padding: "2px 8px", background: "#F3F4F6", borderRadius: 5, fontSize: 9, color: "#6B7280" }}
        >
          edify.app / dashboard
        </div>
        <div
          className="ml-auto inline-flex items-center gap-1.5 font-mono"
          style={{ fontSize: 8, color: "#9CA3AF", letterSpacing: "0.08em" }}
        >
          <span
            style={{
              width: 5, height: 5, borderRadius: 9999,
              background: "#22C55E", boxShadow: "0 0 5px #22C55E",
              animation: "active-pulse 2s ease-in-out infinite",
            }}
          />
          ALL DIRECTORS ACTIVE
        </div>
      </div>

      {/* app shell: sidebar + main */}
      <div className="flex" style={{ height: "calc(100% - 34px)" }}>

        {/* SIDEBAR — mirrors real Edify sidebar */}
        <div
          className="flex flex-col items-center gap-2.5"
          style={{
            width: 40,
            background: "#FFFFFF",
            borderRight: "1px solid #E5E7EB",
            padding: "10px 0",
            flexShrink: 0,
          }}
        >
          {/* logo mark */}
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: `linear-gradient(135deg, ${BRAND_PURPLE}, #7C3AED)`,
              marginBottom: 2,
            }}
          />
          {/* nav icon slots — active = Dashboard */}
          {[
            { active: true, accent: BRAND_PURPLE },   // Dashboard
            { active: false, accent: "#D1D5DB" },      // Briefing
            { active: false, accent: "#F59E5C" },      // Inbox (amber = has items)
            { active: false, accent: "#D1D5DB" },      // Tasks
            { active: false, accent: "#D1D5DB" },      // Decision Lab
            { active: false, accent: "#D1D5DB" },      // Memory
          ].map((item, i) => (
            <div
              key={i}
              style={{
                width: 20,
                height: 20,
                borderRadius: 5,
                background: item.active ? `${item.accent}20` : "transparent",
                border: item.active ? `1px solid ${item.accent}40` : "1px solid transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 2,
                  background: item.accent,
                  opacity: item.active ? 1 : 0.3,
                }}
              />
            </div>
          ))}
          {/* 6 archetype color dots — represents the team in sidebar */}
          <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 3 }}>
            {SIDEBAR_ARCHETYPE_DOTS.map((color, i) => (
              <div
                key={i}
                style={{ width: 6, height: 6, borderRadius: 9999, background: color, opacity: 0.7 }}
              />
            ))}
          </div>
        </div>

        {/* MAIN CONTENT — mirrors real dashboard layout */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#F9FAFB" }}>

          {/* greeting header */}
          <div
            className="flex items-baseline justify-between"
            style={{ padding: "7px 12px 5px", background: "#FFFFFF", borderBottom: "1px solid #E5E7EB" }}
          >
            <div>
              <div className="font-mono" style={{ fontSize: 6.5, color: "#9CA3AF", letterSpacing: "0.1em" }}>
                MONDAY · APR 28
              </div>
              <div className="font-medium" style={{ fontSize: 10.5, color: "#111827", marginTop: 1 }}>
                Good morning.{" "}
                <span style={{ color: "#6B7280" }}>Your team moved </span>
                <span style={{ color: BRAND_PURPLE }}>42</span>
                <span style={{ color: "#6B7280" }}> things forward.</span>
              </div>
            </div>
            <div className="flex items-center gap-1 font-mono" style={{ fontSize: 7, color: "#9CA3AF" }}>
              <span
                style={{ width: 5, height: 5, borderRadius: 9999, background: "#22C55E", boxShadow: "0 0 4px #22C55E", display: "inline-block" }}
              />
              ALL DIRECTORS ACTIVE
            </div>
          </div>

          {/* content area */}
          <div
            className="grid flex-1 overflow-hidden"
            style={{ gridTemplateColumns: "1.35fr 1fr", gap: 8, padding: 8 }}
          >
            {/* LEFT: Development Director chat */}
            <div
              className="flex flex-col gap-1.5 overflow-hidden"
              style={{
                background: "#FFFFFF",
                borderRadius: 9,
                border: "1px solid #E5E7EB",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                padding: 9,
              }}
            >
              {/* director header */}
              <div className="flex items-center gap-1.5">
                <MiniMark color={DEV_COLOR} size={20} light>
                  <path d="M11 14h2a2 2 0 0 0 2-2 2 2 0 0 0-2-2H9.8c-.5 0-1 .2-1.4.5L6.5 12" fill="none" stroke={DEV_COLOR} strokeWidth="1.5" />
                  <path d="m13 17 4-3 3 3-4 4-7-1L4 18v-5l3-1 3.5 1L13 17z" fill="none" stroke={DEV_COLOR} strokeWidth="1.5" />
                </MiniMark>
                <div>
                  <div className="font-mono" style={{ fontSize: 7.5, color: DEV_COLOR, letterSpacing: "0.08em" }}>
                    DEVELOPMENT DIRECTOR
                  </div>
                  <div className="italic" style={{ fontSize: 9, color: "#9CA3AF" }}>
                    — unnamed —
                  </div>
                </div>
                <span className="ml-auto font-mono" style={{ fontSize: 7, color: "#22C55E" }}>
                  ● Ready
                </span>
              </div>

              <div className="flex-1 flex flex-col gap-1.5 justify-start overflow-hidden">
                {/* user bubble */}
                <div
                  style={{
                    alignSelf: "flex-end",
                    maxWidth: "80%",
                    background: BRAND_PURPLE,
                    color: "#FFFFFF",
                    padding: "5px 9px",
                    borderRadius: "9px 9px 2px 9px",
                    fontSize: 9.5,
                    lineHeight: 1.4,
                    fontWeight: 500,
                    opacity: op(showUser),
                    transform: `translateY(${showUser ? 0 : 5}px) scale(${showUser ? 1 : 0.98})`,
                    transition: "all 400ms cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  Find grants for our youth workforce program due this quarter.
                </div>

                {/* thinking indicator */}
                <div
                  className="flex gap-1.5 items-center"
                  style={{
                    alignSelf: "flex-start",
                    background: "#F9FAFB",
                    padding: "4px 9px",
                    borderRadius: "2px 9px 9px 9px",
                    border: "1px solid #E5E7EB",
                    boxShadow: `0 0 0 1px ${DEV_COLOR}30, 0 0 8px ${DEV_COLOR}18`,
                    opacity: op(showThinking),
                    transform: `translateY(${showThinking ? 0 : 4}px)`,
                    transition: "all 300ms cubic-bezier(0.16,1,0.3,1)",
                  }}
                >
                  <Dot delay={0} color={DEV_COLOR} />
                  <Dot delay={0.16} color={DEV_COLOR} />
                  <Dot delay={0.32} color={DEV_COLOR} />
                  <span className="italic" style={{ fontSize: 7.5, color: "#9CA3AF", marginLeft: 3 }}>
                    researching
                  </span>
                </div>

                {/* reply bubble */}
                <div
                  style={{
                    alignSelf: "flex-start",
                    maxWidth: "88%",
                    background: "#F9FAFB",
                    color: "#374151",
                    padding: "6px 9px",
                    borderRadius: "2px 9px 9px 9px",
                    border: "1px solid #E5E7EB",
                    borderLeft: `2px solid ${DEV_COLOR}`,
                    fontSize: 9.5,
                    lineHeight: 1.5,
                    opacity: op(showReply),
                    transform: `translateY(${showReply ? 0 : 5}px) scale(${showReply ? 1 : 0.98})`,
                    transition: "all 500ms cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  Found 3 strong matches. Top pick: Kellogg Youth Workforce Fund — $75K, deadline May 15. Drafting LOI now.
                </div>

                {/* file card — LOI draft */}
                <div
                  className="flex items-center gap-1.5"
                  style={{
                    alignSelf: "flex-start",
                    maxWidth: "85%",
                    marginLeft: 14,
                    background: "#FFFFFF",
                    padding: 6,
                    borderRadius: 7,
                    border: showFile && t < 4.6
                      ? `1px solid ${DEV_COLOR}80`
                      : "1px solid #E5E7EB",
                    boxShadow: showFile && t < 4.6
                      ? `0 0 14px ${DEV_COLOR}38`
                      : "0 1px 2px rgba(0,0,0,0.04)",
                    opacity: op(showFile),
                    transform: `scale(${showFile ? 1 : 0.92})`,
                    transition: "all 520ms cubic-bezier(0.2, 0.9, 0.1, 1.2)",
                  }}
                >
                  <div
                    className="flex items-center justify-center font-mono"
                    style={{
                      width: 20,
                      height: 25,
                      borderRadius: 3,
                      background: `${DEV_COLOR}18`,
                      fontSize: 5.5,
                      color: DEV_COLOR,
                      fontWeight: 700,
                      border: `1px solid ${DEV_COLOR}30`,
                    }}
                  >
                    DOC
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 8.5,
                        color: "#111827",
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      Kellogg-LOI-draft.docx
                    </div>
                    <div className="font-mono" style={{ fontSize: 6.5, color: "#9CA3AF", marginTop: 1 }}>
                      just now · needs review
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: stat cards + approval card — mirrors real dashboard right column */}
            <div className="flex flex-col gap-2">

              {/* Hours saved — matches real HoursSavedCard label */}
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: 9,
                  border: "1px solid #E5E7EB",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  padding: "7px 9px",
                }}
              >
                <div className="font-mono" style={{ fontSize: 6.5, color: "#9CA3AF", letterSpacing: "0.1em" }}>
                  HOURS SAVED
                </div>
                <div
                  className="font-mono font-medium"
                  style={{ fontSize: 22, color: "#111827", letterSpacing: "-0.02em", lineHeight: 1, marginTop: 3 }}
                >
                  {hoursTick ? "23.5" : "23.0"}
                  {hoursTick && t < 7.2 && (
                    <span
                      className="font-mono"
                      style={{ fontSize: 8, color: "#22C55E", marginLeft: 3, animation: "tick-pop 900ms ease-out both" }}
                    >
                      +0.5 hrs
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 7, color: "#22C55E", marginTop: 3 }}>since Apr 1</div>
              </div>

              {/* Needs review — amber, matches real dashboard approval banner */}
              <div
                className="relative overflow-hidden"
                style={{
                  background: "#FFFFFF",
                  borderRadius: 9,
                  border: "1px solid #E5E7EB",
                  boxShadow: "0 0 0 1px rgba(245,181,68,0.35), 0 1px 3px rgba(0,0,0,0.05)",
                  padding: "7px 9px",
                }}
              >
                <div
                  aria-hidden
                  className="absolute pointer-events-none"
                  style={{
                    top: 0, right: 0,
                    width: 60, height: "100%",
                    background: "linear-gradient(90deg, transparent, rgba(245,181,68,0.1))",
                    animation: "amber-shift 4s ease-in-out infinite",
                  }}
                />
                <div className="relative">
                  <div className="font-mono" style={{ fontSize: 6.5, color: "#F5B544", letterSpacing: "0.1em" }}>
                    NEEDS YOUR ATTENTION
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span
                      className="font-mono font-medium"
                      style={{ fontSize: 22, color: "#111827", letterSpacing: "-0.02em", lineHeight: 1, transition: "all 300ms ease" }}
                    >
                      {showApproval ? 4 : 3}
                    </span>
                    <span style={{ fontSize: 7.5, color: "#6B7280" }}>approvals pending</span>
                  </div>
                </div>
              </div>

              {/* approval card — mirrors real dashboard inbox item */}
              <div
                className="flex-1 flex flex-col"
                style={{
                  background: "#FFFFFF",
                  borderRadius: 9,
                  border: "1px solid #E5E7EB",
                  boxShadow: "0 0 0 1px rgba(245,181,68,0.3), 0 1px 3px rgba(0,0,0,0.05)",
                  padding: 8,
                  opacity: op(showApproval),
                  transform: `translateY(${showApproval ? 0 : 14}px)`,
                  transition: "all 520ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <MiniMark color={DEV_COLOR} size={16} light>
                    <path d="M11 14h2a2 2 0 0 0 2-2 2 2 0 0 0-2-2H9.8c-.5 0-1 .2-1.4.5L6.5 12" fill="none" stroke={DEV_COLOR} strokeWidth="1.5" />
                    <path d="m13 17 4-3 3 3-4 4-7-1L4 18v-5l3-1 3.5 1L13 17z" fill="none" stroke={DEV_COLOR} strokeWidth="1.5" />
                  </MiniMark>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="font-mono" style={{ fontSize: 6.5, color: DEV_COLOR, letterSpacing: "0.08em" }}>
                      DEVELOPMENT DIRECTOR
                    </div>
                    <div
                      style={{
                        fontSize: 8.5,
                        color: "#111827",
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      Donor thank-you — Maria Reyes
                    </div>
                  </div>
                </div>
                <div
                  className="italic flex-1"
                  style={{
                    background: "#F9FAFB",
                    borderRadius: 4,
                    padding: "5px 7px",
                    fontSize: 7.5,
                    color: "#4B5563",
                    lineHeight: 1.5,
                    border: "1px solid #E5E7EB",
                  }}
                >
                  &ldquo;Dear Maria, thank you for your generous $2,500 gift — your support directly funds our summer youth cohort…&rdquo;
                </div>
                <div className="flex gap-1.5 mt-1.5">
                  <div
                    className="text-center"
                    style={{
                      flex: 1,
                      background: BRAND_PURPLE,
                      color: "#FFFFFF",
                      borderRadius: 4,
                      padding: "3px 0",
                      fontSize: 7.5,
                      fontWeight: 600,
                    }}
                  >
                    Approve &amp; send
                  </div>
                  <div
                    style={{
                      padding: "3px 7px",
                      border: "1px solid #E5E7EB",
                      borderRadius: 4,
                      color: "#6B7280",
                      fontSize: 7.5,
                    }}
                  >
                    Edit
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dot({ delay, color = BRAND_PURPLE }: { delay: number; color?: string }) {
  return (
    <span
      style={{
        width: 4,
        height: 4,
        borderRadius: 9999,
        background: color,
        animation: `edify-dot 1.2s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      <style jsx>{`
        @keyframes edify-dot {
          0%,
          100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
      `}</style>
    </span>
  );
}

/**
 * MiniMark — archetype icon badge.
 * light=true: white/tinted bg with colored border (real dashboard light mode).
 * light=false (default): dark gradient bg.
 */
function MiniMark({
  children,
  color,
  size = 24,
  light = false,
}: {
  children: React.ReactNode;
  color: string;
  size?: number;
  light?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-center relative overflow-hidden shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: 5,
        background: light ? `${color}15` : `linear-gradient(135deg, ${color}33, ${color}0A)`,
        border: light ? `1px solid ${color}40` : undefined,
        boxShadow: light ? undefined : `inset 0 0 0 1px ${color}55`,
      }}
    >
      {!light && (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ backgroundImage: `repeating-linear-gradient(135deg, transparent 0 5px, ${color}14 5px 6px)` }}
        />
      )}
      <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24" className="relative">
        {children}
      </svg>
    </div>
  );
}
