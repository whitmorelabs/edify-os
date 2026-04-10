"use client";

import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

interface StatusStyle {
  bg: string;
  text: string;
  dot?: boolean;
}

const STATUS_STYLES: Record<string, StatusStyle> = {
  pending: { bg: "bg-slate-100", text: "text-slate-600" },
  planning: { bg: "bg-brand-50", text: "text-brand-700" },
  executing: { bg: "bg-amber-50", text: "text-amber-700" },
  awaiting_approval: { bg: "bg-sky-50", text: "text-sky-700" },
  approved: { bg: "bg-emerald-50", text: "text-emerald-700" },
  completed: { bg: "bg-emerald-50", text: "text-emerald-700" },
  failed: { bg: "bg-red-50", text: "text-red-700" },
  cancelled: { bg: "bg-slate-100", text: "text-slate-500" },
  active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: true },
};

const DEFAULT_STYLE: StatusStyle = { bg: "bg-slate-100", text: "text-slate-600" };

function formatStatus(status: string): string {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? DEFAULT_STYLE;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        style.bg,
        style.text,
        size === "sm"
          ? "px-2 py-0.5 text-[10px]"
          : "px-2.5 py-0.5 text-xs"
      )}
    >
      {style.dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      )}
      {formatStatus(status)}
    </span>
  );
}
