"use client";

import { ArrowUp, ArrowDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-slate-200 shadow-sm p-5",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
          <Icon size={20} className="text-brand-500" />
        </div>
        <span className="text-sm font-medium text-slate-500">{label}</span>
      </div>

      <div className="mt-3 flex items-end gap-2">
        <span className="text-2xl font-bold text-slate-900">{value}</span>

        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium mb-0.5",
              trend.positive ? "text-emerald-600" : "text-red-600"
            )}
          >
            {trend.positive ? (
              <ArrowUp size={14} />
            ) : (
              <ArrowDown size={14} />
            )}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </div>
  );
}
