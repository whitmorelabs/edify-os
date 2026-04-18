"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Building, Key, ArrowRight, Loader2 } from "lucide-react";
import { ANTHROPIC_KEY_PREFIX } from "@/lib/anthropic";

/**
 * /onboarding — New-user org creation page.
 *
 * Shown to authenticated users who have no member row yet.
 * Collects org name + Anthropic API key, calls POST /api/org/create,
 * then redirects to /dashboard on success.
 *
 * Auth required (middleware enforces it). Member row NOT required.
 * The (auth) layout provides the two-panel dark shell and card wrapper.
 */
export default function OnboardingPage() {
  const router = useRouter();
  const inFlightRef = useRef(false);

  const [orgName, setOrgName] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

    setSubmitting(true);
    try {
      const res = await fetch("/api/org/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName: orgName.trim(),
          anthropicKey: trimmedKey,
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
