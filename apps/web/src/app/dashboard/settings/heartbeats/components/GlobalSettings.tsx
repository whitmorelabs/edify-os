"use client";

import { Moon } from "lucide-react";

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  { value: "UTC", label: "UTC" },
];

const DIGEST_HOURS = [
  { value: "06:00", label: "6:00 AM" },
  { value: "07:00", label: "7:00 AM" },
  { value: "08:00", label: "8:00 AM" },
  { value: "09:00", label: "9:00 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "17:00", label: "5:00 PM" },
  { value: "18:00", label: "6:00 PM" },
  { value: "19:00", label: "7:00 PM" },
  { value: "20:00", label: "8:00 PM" },
];

interface GlobalSettingsProps {
  enabled: boolean;
  timezone: string;
  emailDigest: boolean;
  digestTime: string;
  onEnabledChange: (value: boolean) => void;
  onTimezoneChange: (value: string) => void;
  onEmailDigestChange: (value: boolean) => void;
  onDigestTimeChange: (value: string) => void;
}

export function GlobalSettings({
  enabled,
  timezone,
  emailDigest,
  digestTime,
  onEnabledChange,
  onTimezoneChange,
  onEmailDigestChange,
  onDigestTimeChange,
}: GlobalSettingsProps) {
  return (
    <div className="card p-6 space-y-5">
      {/* Master toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-slate-900">Enable proactive check-ins</p>
          <p className="text-sm text-slate-500 mt-0.5">
            Your team will reach out with updates, alerts, and suggestions throughout the day.
          </p>
        </div>
        <button
          role="switch"
          aria-checked={enabled}
          onClick={() => onEnabledChange(!enabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:ring-offset-2 ${
            enabled ? "bg-brand-500" : "bg-slate-200"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      <div className="border-t border-slate-100" />

      {/* Timezone */}
      <div>
        <label className="label mb-1.5 block">Your timezone</label>
        <select
          value={timezone}
          onChange={(e) => onTimezoneChange(e.target.value)}
          className="input-field"
          disabled={!enabled}
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>

      {/* Email digest */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-900">Send me a daily email summary</p>
          <p className="text-sm text-slate-500 mt-0.5">
            Get a digest of all team updates in one email each day.
          </p>
        </div>
        <button
          role="switch"
          aria-checked={emailDigest}
          onClick={() => onEmailDigestChange(!emailDigest)}
          disabled={!enabled}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed ${
            emailDigest && enabled ? "bg-brand-500" : "bg-slate-200"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
              emailDigest && enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Digest time — only when digest is on */}
      {emailDigest && enabled && (
        <div className="ml-0 rounded-lg bg-brand-50 border border-brand-100 p-4">
          <label className="label mb-2 block">Deliver digest at</label>
          <select
            value={digestTime}
            onChange={(e) => onDigestTimeChange(e.target.value)}
            className="input-field"
          >
            {DIGEST_HOURS.map((h) => (
              <option key={h.value} value={h.value}>
                {h.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Quiet hours note */}
      <div className="flex items-start gap-3 rounded-lg bg-slate-50 border border-slate-200 p-4">
        <Moon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
        <p className="text-sm text-slate-600">
          Your team won&apos;t check in outside the active hours you set for each person below.
          Configure those hours per team member.
        </p>
      </div>
    </div>
  );
}
