import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number; // +/- percentage
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

export function StatCard({ title, value, change, icon: Icon, iconBg, iconColor }: StatCardProps) {
  const hasChange = change !== undefined;
  const isPositive = hasChange && change > 0;
  const isNegative = hasChange && change < 0;

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        {hasChange && (
          <div
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              isPositive
                ? "bg-emerald-100 text-emerald-700"
                : isNegative
                ? "bg-red-100 text-red-700"
                : "bg-[var(--bg-4)] text-[var(--fg-3)]"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : isNegative ? (
              <TrendingDown className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-[var(--fg-1)]">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="mt-1 text-sm text-[var(--fg-3)]">{title}</p>
    </div>
  );
}
