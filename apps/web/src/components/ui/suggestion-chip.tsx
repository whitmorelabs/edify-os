"use client";

import type { MouseEventHandler, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SuggestionChipProps {
  children: ReactNode;
  /** Leading icon — typically a sparkle. */
  icon?: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

/**
 * SuggestionChip — pill-shaped prompt. Used in chat empty-states and
 * "try one of these" rails. Sentence-case, imperative.
 */
export function SuggestionChip({ children, icon, onClick, className }: SuggestionChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full px-4 py-2.5 text-[14px]",
        "bg-[var(--bg-2)] text-[var(--fg-1)]",
        "shadow-[inset_0_0_0_1px_var(--line-2)]",
        "transition-[background,box-shadow,transform]",
        "hover:bg-[var(--bg-3)] hover:-translate-y-[1px]",
        "hover:shadow-[inset_0_0_0_1px_var(--line-purple)]",
        "active:translate-y-0 active:scale-[0.99]",
        className,
      )}
      style={{
        transitionDuration: "var(--dur-fast)",
        transitionTimingFunction: "var(--ease-standard)",
      }}
    >
      {icon && <span className="text-[var(--brand-purple)] shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}
