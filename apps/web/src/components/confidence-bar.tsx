"use client";

import { cn } from "@/lib/utils";

interface ConfidenceBarProps {
  score: number;
  size?: "sm" | "md";
  showLabel?: boolean;
}

function getBarColor(score: number): string {
  if (score < 0.5) return "bg-red-500";
  if (score <= 0.75) return "bg-amber-500";
  return "bg-emerald-500";
}

export function ConfidenceBar({
  score,
  size = "sm",
  showLabel = false,
}: ConfidenceBarProps) {
  const clampedScore = Math.max(0, Math.min(1, score));
  const percentage = Math.round(clampedScore * 100);

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "flex-1 rounded-full bg-slate-100",
          size === "sm" ? "h-1.5" : "h-2"
        )}
      >
        <div
          className={cn(
            "rounded-full transition-all duration-500",
            size === "sm" ? "h-1.5" : "h-2",
            getBarColor(clampedScore)
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {showLabel && (
        <span className="text-xs font-medium text-slate-600 tabular-nums">
          {percentage}%
        </span>
      )}
    </div>
  );
}
