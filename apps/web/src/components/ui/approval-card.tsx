"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArchetypeMark } from "./archetype-mark";
import { Button } from "./button";
import type { Archetype } from "./archetypes";
import { DURATION, EASE } from "@/lib/motion";

export interface ApprovalCardProps {
  arc: Archetype;
  /** Title — short, sentence-case. */
  title: string;
  /** Relative ago timestamp. */
  ago: string;
  /** Preview of the drafted content (agent voice, italic). */
  preview: string;
  /** Stagger index. */
  index?: number;
  /** If set, card is mid-exit (from parent state). */
  leaving?: "approve" | "reject";
  onApprove: () => void;
  onReject: () => void;
  onEdit?: () => void;
  /** Optional additional content below the preview. */
  children?: ReactNode;
}

/**
 * ApprovalCard — pending director output. Amber hairline, preview, 3 CTAs.
 * On approve: slides right + fades + height collapses.
 * On reject: short slide left + wobble + collapse.
 * Parent must unmount after ~450ms so exit plays cleanly.
 */
export function ApprovalCard({
  arc,
  title,
  ago,
  preview,
  index = 0,
  leaving,
  onApprove,
  onReject,
  onEdit,
  children,
}: ApprovalCardProps) {
  const entryDelay = Math.min(index, 6) * 0.12 + 0.06;

  let animate: Record<string, number>;
  if (leaving === "approve") {
    animate = { x: 40, opacity: 0, height: 0 };
  } else if (leaving === "reject") {
    animate = { x: -20, rotate: -2, opacity: 0, height: 0 };
  } else {
    animate = { opacity: 1, x: 0 };
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 32 }}
      animate={animate}
      transition={
        leaving
          ? { duration: 0.45, ease: EASE.exit, height: { delay: 0.27, duration: 0.18 } }
          : { duration: DURATION.slow, ease: EASE.entrance, delay: entryDelay }
      }
      className="relative overflow-hidden rounded-[16px] bg-[var(--bg-2)] p-6"
      style={{
        boxShadow:
          leaving === "approve"
            ? "inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px var(--line-purple), 0 0 32px var(--purple-a48)"
            : "inset 0 1px 0 rgba(255,255,255,0.08), 0 12px 32px rgba(0,0,0,0.5), 0 0 0 1px var(--warn-line)",
      }}
    >
      {/* amber glow corner */}
      <div
        aria-hidden
        className="absolute -top-10 -right-10 w-[140px] h-[140px] pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${arc.color}22, transparent 70%)`,
          animation: "amber-shift 5s ease-in-out infinite",
        }}
      />
      <div className="relative">
        <div className="flex items-start gap-4 mb-3.5">
          <ArchetypeMark arc={arc} size={44} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1.5">
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: "var(--warn)" }}
              >
                NEEDS REVIEW
              </span>
              <span className="font-mono text-[11px] text-[var(--fg-3)]">
                · {arc.short} · {ago}
              </span>
            </div>
            <div className="text-[18px] font-medium leading-[1.3] tracking-[-0.005em] text-[var(--fg-1)]">
              {title}
            </div>
          </div>
        </div>

        <div
          className="rounded-[10px] px-4 py-3.5 text-[14px] italic leading-[1.65] text-[var(--fg-2)] mb-4"
          style={{
            background: "var(--bg-0)",
            boxShadow: "inset 0 0 0 1px var(--line-2)",
          }}
        >
          &ldquo;{preview}&rdquo;
        </div>

        {children}

        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={onApprove} className="flex-1">
            Approve & send
          </Button>
          {onEdit && (
            <Button variant="secondary" size="sm" onClick={onEdit}>
              Edit
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onReject}>
            Discard
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
