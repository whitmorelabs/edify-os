"use client";

/**
 * AnimatedDashboard — the landing hero's "live mini-dashboard" preview.
 * A looping 10s simulation:
 *   0.3s: User bubble pops in
 *   1.4s: Director typing indicator
 *   2.9s: Agent reply bubble
 *   3.8s: File card arrives with purple glow
 *   5.1s: Approval card drops into rail, counter +1
 *   6.2s: Tasks counter ticks from 126 → 127
 *   8.8s: Fade out
 *   10s:  Loop
 */

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

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
  const taskTick = t >= 6.2 ? 127 : 126;
  const fadeAll = t >= 8.8;

  const op = (visible: boolean) =>
    visible ? (fadeAll ? Math.max(0, 1 - (t - 8.8) / 1.0) : 1) : 0;

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        aspectRatio: "16 / 10",
        borderRadius: 20,
        background:
          "linear-gradient(160deg, #0A0A0F 0%, #120C1E 50%, #0A0A0F 100%)",
        boxShadow:
          "0 1px 0 0 rgba(255,255,255,0.06) inset, 0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1), 0 0 80px rgba(159,78,243,0.15)",
      }}
    >
      {/* ambient orbs */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top: "-20%",
          left: "-10%",
          width: "60%",
          height: "80%",
          background:
            "radial-gradient(circle, rgba(159,78,243,0.25), transparent 60%)",
          filter: "blur(40px)",
          animation: "blob-a 12s ease-in-out infinite",
        }}
      />
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          bottom: "-20%",
          right: "-10%",
          width: "50%",
          height: "70%",
          background:
            "radial-gradient(circle, rgba(244,114,182,0.14), transparent 60%)",
          filter: "blur(50px)",
          animation: "blob-b 16s ease-in-out infinite",
        }}
      />

      {/* top chrome */}
      <div
        className="flex items-center gap-2.5 relative"
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex gap-1.5">
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
            <span
              key={c}
              style={{
                width: 10,
                height: 10,
                borderRadius: 9999,
                background: c,
                opacity: 0.7,
              }}
            />
          ))}
        </div>
        <div
          className="ml-3.5 inline-flex items-center gap-1.5 font-mono"
          style={{
            padding: "3px 10px",
            background: "rgba(255,255,255,0.04)",
            borderRadius: 6,
            fontSize: 10,
            color: "#8E8B9C",
          }}
        >
          edify.app / dashboard
        </div>
        <div
          className="ml-auto inline-flex items-center gap-1.5 font-mono"
          style={{ fontSize: 9, color: "#8E8B9C", letterSpacing: "0.1em" }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: 9999,
              background: "#4ADE80",
              boxShadow: "0 0 6px #4ADE80",
              animation: "active-pulse 2s ease-in-out infinite",
            }}
          />
          LIVE
        </div>
      </div>

      {/* main grid */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: "1.3fr 1fr",
          gap: 14,
          padding: 14,
          height: "calc(100% - 48px)",
        }}
      >
        {/* LEFT: chat column */}
        <div
          className="flex flex-col gap-2.5 relative overflow-hidden"
          style={{
            background: "rgba(17,17,25,0.8)",
            borderRadius: 12,
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
            padding: 14,
          }}
        >
          <div className="flex items-center gap-2">
            <MiniMark color="#9F4EF3" size={24}>
              <path d="M7 4h10v3H7zM7 10.5h10v3H7zM7 17h10v3H7z" fill="#9F4EF3" />
            </MiniMark>
            <div>
              <div
                className="font-mono"
                style={{ fontSize: 10, color: "#9F4EF3", letterSpacing: "0.1em" }}
              >
                EXECUTIVE ASSISTANT
              </div>
              <div
                className="italic"
                style={{ fontSize: 12, color: "#C8C6D1" }}
              >
                — unnamed —
              </div>
            </div>
            <span
              className="ml-auto font-mono"
              style={{ fontSize: 9, color: "#4ADE80" }}
            >
              ● ACTIVE
            </span>
          </div>

          <div className="flex-1 flex flex-col gap-2 justify-start">
            {/* user bubble */}
            <div
              style={{
                alignSelf: "flex-end",
                maxWidth: "78%",
                background: "#9F4EF3",
                color: "#0A0A0F",
                padding: "8px 12px",
                borderRadius: "10px 10px 3px 10px",
                fontSize: 12,
                lineHeight: 1.4,
                fontWeight: 500,
                opacity: op(showUser),
                transform: `translateY(${showUser ? 0 : 6}px) scale(${showUser ? 1 : 0.98})`,
                transition: "all 400ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              Prep me for Tuesday&apos;s board meeting.
            </div>

            {/* thinking */}
            <div
              className="flex gap-1.5 items-center"
              style={{
                alignSelf: "flex-start",
                background: "rgba(23,23,31,0.9)",
                padding: "7px 12px",
                borderRadius: "3px 10px 10px 10px",
                boxShadow:
                  "inset 0 0 0 1px rgba(255,255,255,0.08), 0 0 0 1px rgba(159,78,243,0.24), 0 0 12px rgba(159,78,243,0.24)",
                opacity: op(showThinking),
                transform: `translateY(${showThinking ? 0 : 4}px)`,
                transition: "all 300ms cubic-bezier(0.16,1,0.3,1)",
              }}
            >
              <Dot delay={0} />
              <Dot delay={0.16} />
              <Dot delay={0.32} />
              <span
                className="italic"
                style={{ fontSize: 10, color: "#8E8B9C", marginLeft: 4 }}
              >
                thinking
              </span>
            </div>

            {/* reply bubble */}
            <div
              style={{
                alignSelf: "flex-start",
                maxWidth: "82%",
                background: "rgba(23,23,31,0.9)",
                color: "#F4F3F7",
                padding: "9px 12px",
                borderRadius: "3px 10px 10px 10px",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
                borderLeft: "2px solid #9F4EF3",
                fontSize: 12,
                lineHeight: 1.5,
                opacity: op(showReply),
                transform: `translateY(${showReply ? 0 : 6}px) scale(${showReply ? 1 : 0.98})`,
                transition: "all 500ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              Pulled last quarter&apos;s numbers and drafted opening remarks.
            </div>

            {/* file card */}
            <div
              className="flex items-center gap-2"
              style={{
                alignSelf: "flex-start",
                maxWidth: "82%",
                marginLeft: 20,
                background: "#111119",
                padding: 8,
                borderRadius: 10,
                boxShadow:
                  showFile && t < 4.6
                    ? "0 0 0 1px rgba(159,78,243,0.6), 0 0 24px rgba(159,78,243,0.5)"
                    : "0 0 0 1px rgba(255,255,255,0.08)",
                opacity: op(showFile),
                transform: `scale(${showFile ? 1 : 0.92})`,
                transition: "all 520ms cubic-bezier(0.2, 0.9, 0.1, 1.2)",
              }}
            >
              <div
                className="flex items-center justify-center font-mono"
                style={{
                  width: 26,
                  height: 32,
                  borderRadius: 4,
                  background: "#1A1030",
                  fontSize: 7,
                  color: "#D8B8F9",
                  fontWeight: 500,
                  boxShadow: "inset 0 0 0 1px rgba(159,78,243,0.32)",
                }}
              >
                PDF
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 10.5,
                    color: "#F4F3F7",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Board-prep-Q3.pdf
                </div>
                <div
                  className="font-mono"
                  style={{ fontSize: 9, color: "#8E8B9C", marginTop: 1 }}
                >
                  just now
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: stats + approvals */}
        <div className="flex flex-col gap-3">
          {/* tasks tile */}
          <div
            className="relative overflow-hidden"
            style={{
              background: "rgba(17,17,25,0.8)",
              borderRadius: 12,
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
              padding: 14,
            }}
          >
            <div
              aria-hidden
              className="absolute pointer-events-none"
              style={{
                top: -30,
                right: -30,
                width: 80,
                height: 80,
                background:
                  "radial-gradient(circle, rgba(159,78,243,0.32), transparent 60%)",
                animation: "amber-shift 4s ease-in-out infinite",
              }}
            />
            <div
              className="font-mono relative"
              style={{
                fontSize: 9,
                color: "#8E8B9C",
                letterSpacing: "0.14em",
              }}
            >
              TASKS COMPLETED
            </div>
            <div
              className="relative font-mono"
              style={{
                fontSize: 36,
                fontWeight: 500,
                letterSpacing: "-0.02em",
                color: "#F4F3F7",
                lineHeight: 1,
                marginTop: 6,
              }}
            >
              {taskTick}
              {taskTick === 127 && t < 7.0 && (
                <span
                  className="absolute font-mono"
                  style={{
                    top: -10,
                    right: -8,
                    fontSize: 11,
                    color: "#4ADE80",
                    animation: "tick-pop 900ms ease-out both",
                  }}
                >
                  +1
                </span>
              )}
            </div>
            <div style={{ fontSize: 10, color: "#4ADE80", marginTop: 6 }}>
              ↑ 23 this week
            </div>
          </div>

          {/* approvals tile */}
          <div
            className="relative overflow-hidden"
            style={{
              background: "rgba(17,17,25,0.8)",
              borderRadius: 12,
              boxShadow: "inset 0 0 0 1px rgba(245,181,68,0.32)",
              padding: 14,
            }}
          >
            <div
              aria-hidden
              className="absolute pointer-events-none"
              style={{
                top: 0,
                right: 0,
                width: 120,
                height: "100%",
                background:
                  "linear-gradient(90deg, transparent, rgba(245,181,68,0.14))",
                animation: "amber-shift 4s ease-in-out infinite",
                opacity: 0.6,
              }}
            />
            <div className="relative">
              <div
                className="font-mono"
                style={{
                  fontSize: 9,
                  color: "#F5B544",
                  letterSpacing: "0.14em",
                }}
              >
                NEEDS REVIEW
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className="font-mono"
                  style={{
                    fontSize: 32,
                    color: "#F4F3F7",
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                    transition: "color 300ms ease",
                  }}
                >
                  {showApproval ? 4 : 3}
                </span>
                <span style={{ fontSize: 10, color: "#C8C6D1" }}>pending</span>
              </div>
            </div>
          </div>

          {/* approval card that drops in */}
          <div
            className="flex-1 flex flex-col"
            style={{
              background: "rgba(17,17,25,0.8)",
              borderRadius: 12,
              padding: 12,
              boxShadow: "inset 0 0 0 1px rgba(245,181,68,0.32)",
              opacity: op(showApproval),
              transform: `translateY(${showApproval ? 0 : 20}px)`,
              transition: "all 520ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <MiniMark color="#F59E5C" size={22}>
                <path
                  d="M12 18L7 14.5V9l5-3 5 3v5.5L12 18z"
                  fill="none"
                  stroke="#F59E5C"
                  strokeWidth="1.5"
                />
                <circle cx="12" cy="12" r="2" fill="#F59E5C" />
              </MiniMark>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  className="font-mono"
                  style={{
                    fontSize: 8.5,
                    color: "#F59E5C",
                    letterSpacing: "0.1em",
                  }}
                >
                  DEVELOPMENT
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#F4F3F7",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Thank you — Anne Harlow
                </div>
              </div>
            </div>
            <div
              className="italic flex-1"
              style={{
                background: "rgba(10,10,15,0.8)",
                borderRadius: 6,
                padding: "8px 10px",
                fontSize: 10,
                color: "#C8C6D1",
                lineHeight: 1.5,
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
              }}
            >
              &ldquo;Dear Anne, thank you so much for your generous $5,000
              gift…&rdquo;
            </div>
            <div className="flex gap-1.5 mt-2">
              <div
                className="text-center"
                style={{
                  flex: 1,
                  background: "#9F4EF3",
                  color: "#0A0A0F",
                  borderRadius: 6,
                  padding: "5px 0",
                  fontSize: 10,
                  fontWeight: 600,
                }}
              >
                Approve & send
              </div>
              <div
                style={{
                  padding: "5px 10px",
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)",
                  borderRadius: 6,
                  color: "#8E8B9C",
                  fontSize: 10,
                }}
              >
                Edit
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      style={{
        width: 4,
        height: 4,
        borderRadius: 9999,
        background: "#9F4EF3",
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

function MiniMark({
  children,
  color,
  size = 24,
}: {
  children: React.ReactNode;
  color: string;
  size?: number;
}) {
  return (
    <div
      className="flex items-center justify-center relative overflow-hidden shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        background: `linear-gradient(135deg, ${color}33, ${color}0A)`,
        boxShadow: `inset 0 0 0 1px ${color}55`,
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(135deg, transparent 0 5px, ${color}14 5px 6px)`,
        }}
      />
      <svg
        width={size * 0.7}
        height={size * 0.7}
        viewBox="0 0 24 24"
        className="relative"
      >
        {children}
      </svg>
    </div>
  );
}
