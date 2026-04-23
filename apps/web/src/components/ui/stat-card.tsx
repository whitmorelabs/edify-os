"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import { Card } from "./card";
import { countUpEase } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  /** Short uppercase eyebrow, e.g. "TASKS DONE". */
  label: string;
  /** Numeric target that animates from 0. */
  value: number;
  /** Optional unit / suffix shown adjacent to the value (not animated). */
  unit?: string;
  /** Optional sublabel below (e.g. "↑ 23 this week"). */
  hint?: ReactNode;
  /** How long the count-up takes — default 1200ms. */
  durationMs?: number;
  /** Swap the normal card surface for the amber "needs review" look. */
  tone?: "default" | "warn";
  /**
   * Whether to render the top-right corner radial glow decoration.
   * Defaults to true. The glow color tracks `tone`:
   *   - "default" → purple glow (rgba(159,78,243,0.16))
   *   - "warn" → amber glow (rgba(255,184,0,0.16))
   */
  showGlow?: boolean;
  className?: string;
}

/**
 * StatCard — the "editorial number" tile.
 * Count-up uses the design system's `countUpEase` and respects
 * prefers-reduced-motion (jumps straight to the value).
 */
export function StatCard({
  label,
  value,
  unit,
  hint,
  durationMs = 1200,
  tone = "default",
  showGlow = true,
  className,
}: StatCardProps) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    setDisplay(0);
    startRef.current = null;
    let raf = 0;
    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const progress = Math.min(1, (ts - startRef.current) / durationMs);
      setDisplay(Math.round(value * countUpEase(progress)));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs, reduced]);

  const formatted = display.toLocaleString("en-US");

  // Glow gradient color based on tone.
  const glowColor =
    tone === "warn"
      ? "rgba(255,184,0,0.16)"
      : "rgba(159,78,243,0.16)";

  return (
    <Card
      className={cn(
        "p-5 relative overflow-hidden",
        tone === "warn" && "shadow-[0_0_0_1px_var(--warn-line)]",
        className,
      )}
    >
      {/* Top-right corner radial glow decoration — design preview §09 */}
      {showGlow && (
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            top: -20,
            right: -20,
            width: 80,
            height: 80,
            background: `radial-gradient(circle, ${glowColor}, transparent 60%)`,
          }}
        />
      )}
      <div
        className="eyebrow"
        style={tone === "warn" ? { color: "var(--warn)" } : undefined}
      >
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span
          className="font-mono font-medium leading-[0.9] tracking-[-0.02em] text-[var(--fg-1)]"
          style={{ fontSize: "44px" }}
        >
          {formatted}
        </span>
        {unit && <span className="text-[var(--fg-3)] text-[14px]">{unit}</span>}
      </div>
      {hint && (
        <div className="mt-3 text-[13px] text-[var(--fg-3)]">{hint}</div>
      )}
    </Card>
  );
}
