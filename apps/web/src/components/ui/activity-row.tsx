"use client";

import { motion } from "framer-motion";
import { ArchetypeMark } from "./archetype-mark";
import { Badge } from "./badge";
import type { Archetype } from "./archetypes";
import { DURATION, EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface ActivityRowProps {
  arc: Archetype;
  /** Past-tense verb — "Scheduled", "Drafted", "Published". */
  verb: string;
  /** One-line headline continuation — "board meeting prep for Tuesday at 9am". */
  headline: string;
  /** Optional body detail. */
  detail?: string;
  /** Relative timestamp — "12m ago", "1h ago", "yesterday". */
  time: string;
  /** Optional badge — e.g. "needs review". */
  badge?: string;
  /** Index used for stagger delay (capped at 6). */
  index?: number;
  onClick?: () => void;
}

/**
 * ActivityRow — news-story format of "what a director did".
 * Grid: 56px mark / flex body / right-column timestamp + optional badge.
 */
export function ActivityRow({
  arc,
  verb,
  headline,
  detail,
  time,
  badge,
  index = 0,
  onClick,
}: ActivityRowProps) {
  const delay = Math.min(index, 6) * 0.05 + 0.08;

  const content = (
    <>
      <div className="pt-0.5">
        <ArchetypeMark arc={arc} size={40} />
      </div>
      <div className="min-w-0">
        <div className="text-[17px] font-medium leading-[1.4] text-[var(--fg-1)] tracking-[-0.005em]">
          <span
            className="font-mono text-[12px] uppercase tracking-[0.1em] mr-2.5 align-middle"
            style={{ color: arc.color }}
          >
            {arc.short}
          </span>
          <span className="text-[var(--fg-2)]">{verb.toLowerCase()}</span> {headline}
        </div>
        {detail && (
          <div className="mt-1.5 text-[14px] leading-[1.55] text-[var(--fg-3)]">
            {detail}
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-2 text-right whitespace-nowrap">
        <span className="font-mono text-[11px] text-[var(--fg-4)]">{time}</span>
        {badge && (
          <Badge tone="warn" eyebrow className="text-[10px]">
            {badge}
          </Badge>
        )}
      </div>
    </>
  );

  const className = cn(
    "grid grid-cols-[56px_1fr_auto] gap-[18px] py-[18px] border-t border-[var(--line-1)]",
    onClick && "cursor-pointer hover:bg-[var(--bg-2)]/40 -mx-2 px-2 rounded-lg transition-colors",
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: DURATION.slow, ease: EASE.entrance, delay }}
      onClick={onClick}
      className={className}
      role={onClick ? "button" : undefined}
    >
      {content}
    </motion.div>
  );
}
