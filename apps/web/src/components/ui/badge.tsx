"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "brand" | "success" | "warn" | "error" | "info";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  /** Eyebrow style — UPPERCASE + tracked caps. */
  eyebrow?: boolean;
}

const tones: Record<BadgeTone, string> = {
  neutral:
    "bg-[var(--bg-3)] text-[var(--fg-2)] shadow-[inset_0_0_0_1px_var(--line-2)]",
  brand:
    "bg-[var(--purple-a12)] text-[var(--brand-tint)] shadow-[inset_0_0_0_1px_var(--line-purple)]",
  success:
    "bg-[var(--success-tint)] text-[var(--success)] shadow-[inset_0_0_0_1px_var(--success-line)]",
  warn:
    "bg-[var(--warn-tint)] text-[var(--warn)] shadow-[inset_0_0_0_1px_var(--warn-line)]",
  error:
    "bg-[var(--error-tint)] text-[var(--error)] shadow-[inset_0_0_0_1px_var(--error-line)]",
  info:
    "bg-[var(--info-tint)] text-[var(--info)] shadow-[inset_0_0_0_1px_var(--info-line)]",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { tone = "neutral", eyebrow = false, className, children, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        tones[tone],
        eyebrow && "uppercase tracking-[0.14em]",
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
});
