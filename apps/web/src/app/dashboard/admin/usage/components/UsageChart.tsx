interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface UsageChartProps {
  title?: string;
  data: ChartDataPoint[];
  showValues?: boolean;
  valueLabel?: string;
}

export function UsageChart({ title, data, showValues = true, valueLabel = "" }: UsageChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-3">
      {title && <h3 className="text-sm font-semibold text-slate-700">{title}</h3>}
      <div className="space-y-2">
        {data.map((item) => {
          const pct = Math.round((item.value / max) * 100);
          const barColor = item.color || "bg-brand-500";

          return (
            <div key={item.label} className="flex items-center gap-3">
              {/* Label */}
              <div className="w-28 shrink-0 text-right text-xs text-slate-600 truncate" title={item.label}>
                {item.label}
              </div>

              {/* Bar track */}
              <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Value */}
              {showValues && (
                <div className="w-16 shrink-0 text-right text-xs font-medium text-slate-700 tabular-nums">
                  {item.value.toLocaleString()}
                  {valueLabel && <span className="text-slate-400 ml-0.5">{valueLabel}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
