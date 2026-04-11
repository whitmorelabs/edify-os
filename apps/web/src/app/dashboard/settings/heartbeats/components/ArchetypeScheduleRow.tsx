"use client";

import { buildSchedulePreview, type ArchetypeMetadata } from "@/lib/archetype-config";
import type { HeartbeatConfig } from "@/app/dashboard/inbox/heartbeats";

const FREQUENCY_OPTIONS: { value: HeartbeatConfig["frequencyHours"]; label: string }[] = [
  { value: 1, label: "Every 1 hour" },
  { value: 2, label: "Every 2 hours" },
  { value: 4, label: "Every 4 hours" },
  { value: 8, label: "Every 8 hours" },
  { value: 24, label: "Once daily" },
];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const label =
    i === 0 ? "12 AM" : i === 12 ? "12 PM" : i < 12 ? `${i} AM` : `${i - 12} PM`;
  return { value: i, label };
});

interface ArchetypeScheduleRowProps {
  meta: ArchetypeMetadata;
  config: HeartbeatConfig;
  globalEnabled: boolean;
  onChange: (updates: Partial<HeartbeatConfig>) => void;
}

export function ArchetypeScheduleRow({
  meta,
  config,
  globalEnabled,
  onChange,
}: ArchetypeScheduleRowProps) {
  const isDisabled = !globalEnabled || !config.enabled;
  const preview = config.enabled
    ? buildSchedulePreview(
        meta.label,
        config.frequencyHours,
        config.activeHoursStart,
        config.activeHoursEnd
      )
    : null;

  return (
    <div
      className={`card p-5 transition-opacity ${isDisabled ? "opacity-60" : "opacity-100"}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        {/* Left: icon + info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.bg}`}
          >
            <meta.icon className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">{meta.label}</p>
            <p className="text-sm text-slate-500 mt-0.5">{meta.scanDescription}</p>
          </div>
        </div>

        {/* Right: toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500">{config.enabled ? "On" : "Off"}</span>
          <button
            role="switch"
            aria-checked={config.enabled}
            disabled={!globalEnabled}
            onClick={() => onChange({ enabled: !config.enabled })}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:ring-offset-2 disabled:cursor-not-allowed ${
              config.enabled && globalEnabled ? "bg-brand-500" : "bg-slate-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                config.enabled && globalEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Schedule controls — shown when enabled */}
      {config.enabled && globalEnabled && (
        <div className="mt-4 flex flex-wrap gap-4 items-end">
          {/* Frequency */}
          <div className="flex-1 min-w-[160px]">
            <label className="label mb-1.5 block">Frequency</label>
            <select
              value={config.frequencyHours}
              onChange={(e) =>
                onChange({
                  frequencyHours: Number(e.target.value) as HeartbeatConfig["frequencyHours"],
                })
              }
              className="input-field"
            >
              {FREQUENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Active hours start */}
          <div className="flex-1 min-w-[120px]">
            <label className="label mb-1.5 block">Start time</label>
            <select
              value={config.activeHoursStart}
              onChange={(e) => onChange({ activeHoursStart: Number(e.target.value) })}
              className="input-field"
            >
              {HOUR_OPTIONS.filter((h) => h.value < config.activeHoursEnd).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Active hours end */}
          <div className="flex-1 min-w-[120px]">
            <label className="label mb-1.5 block">End time</label>
            <select
              value={config.activeHoursEnd}
              onChange={(e) => onChange({ activeHoursEnd: Number(e.target.value) })}
              className="input-field"
            >
              {HOUR_OPTIONS.filter((h) => h.value > config.activeHoursStart).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Preview text */}
      {preview && (
        <p className="mt-3 text-sm text-brand-600 bg-brand-50 rounded-lg px-3 py-2">
          {preview}
        </p>
      )}
    </div>
  );
}
