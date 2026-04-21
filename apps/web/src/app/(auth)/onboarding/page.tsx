"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building, Key, Globe, ArrowRight, Loader2 } from "lucide-react";
import { ANTHROPIC_KEY_PREFIX } from "@/lib/anthropic";

/**
 * /onboarding — New-user org creation page.
 *
 * Shown to authenticated users who have no member row yet.
 * Collects org name + Anthropic API key + timezone, calls POST /api/org/create,
 * then redirects to /dashboard on success.
 *
 * Auth required (middleware enforces it). Member row NOT required.
 * The (auth) layout provides the two-panel dark shell and card wrapper.
 */

const TIMEZONE_OPTIONS: { label: string; value: string }[] = [
  { label: "Pacific Time (US & Canada)", value: "America/Los_Angeles" },
  { label: "Mountain Time (US & Canada)", value: "America/Denver" },
  { label: "Mountain Time — Arizona (no DST)", value: "America/Phoenix" },
  { label: "Central Time (US & Canada)", value: "America/Chicago" },
  { label: "Eastern Time (US & Canada)", value: "America/New_York" },
  { label: "Alaska", value: "America/Anchorage" },
  { label: "Hawaii", value: "Pacific/Honolulu" },
  { label: "Puerto Rico / Atlantic", value: "America/Puerto_Rico" },
  { label: "UTC", value: "UTC" },
  { label: "London (GMT/BST)", value: "Europe/London" },
  { label: "Paris / Berlin (CET/CEST)", value: "Europe/Berlin" },
  { label: "Tokyo (JST)", value: "Asia/Tokyo" },
  { label: "Sydney (AEST/AEDT)", value: "Australia/Sydney" },
];

const FALLBACK_TZ = "America/New_York";

function detectBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || FALLBACK_TZ;
  } catch {
    return FALLBACK_TZ;
  }
}

function isKnownTimezone(tz: string): boolean {
  return TIMEZONE_OPTIONS.some((opt) => opt.value === tz);
}

export default function OnboardingPage() {
  const router = useRouter();
  const inFlightRef = useRef(false);

  const [orgName, setOrgName] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [timezone, setTimezone] = useState(FALLBACK_TZ);
  const [useOther, setUseOther] = useState(false);
  const [otherTimezone, setOtherTimezone] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Detect browser timezone on mount (browser-only)
  useEffect(() => {
    const detected = detectBrowserTimezone();
    if (isKnownTimezone(detected)) {
      setTimezone(detected);
    } else {
      // Unknown zone — pre-fill the "Other" text field and activate it
      setUseOther(true);
      setTimezone("other");
      setOtherTimezone(detected);
    }
  }, []);

  const handleTimezoneChange = (value: string) => {
    if (value === "other") {
      setUseOther(true);
      setTimezone("other");
    } else {
      setUseOther(false);
      setTimezone(value);
    }
  };

  const resolvedTimezone = useOther ? otherTimezone.trim() : timezone;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setError("");

    const trimmedKey = anthropicKey.trim();

    // Client-side pre-validation
    if (!orgName.trim()) {
      setError("Organization name is required.");
      inFlightRef.current = false;
      return;
    }
    if (!trimmedKey) {
      setError("Anthropic API key is required.");
      inFlightRef.current = false;
      return;
    }
    if (!trimmedKey.startsWith(ANTHROPIC_KEY_PREFIX)) {
      setError("Anthropic API key must start with sk-ant-");
      inFlightRef.current = false;
      return;
    }
    if (useOther && !otherTimezone.trim()) {
      setError("Please enter your timezone (e.g. America/New_York).");
      inFlightRef.current = false;
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/org/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName: orgName.trim(),
          anthropicKey: trimmedKey,
          timezone: resolvedTimezone || FALLBACK_TZ,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      // Success — head to dashboard
      router.push("/dashboard");
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setSubmitting(false);
      inFlightRef.current = false;
    }
  };

  return (
    <>
      <h2 className="text-2xl font-bold tracking-tight text-white mb-1">
        Create your organization
      </h2>
      <p className="text-sm text-white/50 mb-8">
        You&apos;ll be set as the owner and can invite your team later.
      </p>

      {error && (
        <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Org name */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-white/50 mb-1.5">
            Organization Name
          </label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Hope Community Foundation"
              required
              disabled={submitting}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 pl-10 text-sm text-white placeholder:text-white/25 focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 transition-colors disabled:opacity-50"
            />
          </div>
        </div>

        {/* Anthropic API key */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-white/50 mb-1.5">
            Anthropic API Key
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              type="password"
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
              placeholder="sk-ant-api03-..."
              required
              disabled={submitting}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 pl-10 font-mono text-sm text-white placeholder:text-white/25 focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 transition-colors disabled:opacity-50"
            />
          </div>
          <p className="mt-1.5 text-xs text-white/35">
            Your key is stored securely and never shared. Get one at{" "}
            <a
              href="https://console.anthropic.com"
              target="_blank"
              rel="noreferrer"
              className="text-[#8B5CF6] hover:text-[#a78bfa] underline"
            >
              console.anthropic.com
            </a>
            .
          </p>
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-white/50 mb-1.5">
            Your Timezone
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30 pointer-events-none" />
            <select
              value={useOther ? "other" : timezone}
              onChange={(e) => handleTimezoneChange(e.target.value)}
              disabled={submitting}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 pl-10 text-sm text-white focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 transition-colors disabled:opacity-50 appearance-none"
            >
              {TIMEZONE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#1a2f38] text-white">
                  {opt.label}
                </option>
              ))}
              <option value="other" className="bg-[#1a2f38] text-white">
                Other (enter manually)
              </option>
            </select>
          </div>
          {useOther && (
            <input
              type="text"
              value={otherTimezone}
              onChange={(e) => setOtherTimezone(e.target.value)}
              placeholder="e.g. America/New_York"
              disabled={submitting}
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 transition-colors disabled:opacity-50"
            />
          )}
          <p className="mt-1.5 text-xs text-white/35">
            Used to interpret &ldquo;today&rdquo; and &ldquo;this week&rdquo; when you chat with your team.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#7C3AED] px-6 py-3 text-sm font-semibold text-white hover:bg-[#8B5CF6] active:bg-[#6D28D9] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50 focus:ring-offset-2 focus:ring-offset-[#243b44] transition-all duration-200 disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Setting up your org&hellip;
            </>
          ) : (
            <>
              Create Organization
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </>
  );
}
