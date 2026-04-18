"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Building, Key, ArrowRight, Loader2 } from "lucide-react";

/**
 * /onboarding — New-user org creation page.
 *
 * Shown to authenticated users who have no member row yet.
 * Collects org name + Anthropic API key, calls POST /api/org/create,
 * then redirects to /dashboard on success.
 *
 * Auth required (middleware enforces it). Member row NOT required.
 */
export default function OnboardingPage() {
  const router = useRouter();

  const [orgName, setOrgName] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side pre-validation
    if (!orgName.trim()) {
      setError("Organization name is required.");
      return;
    }
    if (!anthropicKey.trim()) {
      setError("Anthropic API key is required.");
      return;
    }
    if (!anthropicKey.trim().startsWith("sk-ant-")) {
      setError("Anthropic API key must start with sk-ant-");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/org/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName: orgName.trim(),
          anthropicKey: anthropicKey.trim(),
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
    }
  };

  return (
    <div className="flex min-h-screen bg-[#1a2b32]">
      {/* Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0f1f26] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(139,92,246,0.15),transparent_70%)]" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7C3AED]">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Edify OS</span>
          </Link>

          <div className="max-w-md">
            <h1 className="text-4xl font-extrabold tracking-tight leading-[1.2]">
              Let&apos;s set up your organization.
            </h1>
            <p className="mt-4 text-lg text-white/70 leading-relaxed">
              Two quick steps and your AI leadership team will be ready to work.
            </p>
            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-4 rounded-xl bg-white/5 border border-white/10 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#7C3AED]/20">
                  <Building className="h-5 w-5 text-[#8B5CF6]" />
                </div>
                <div>
                  <p className="font-semibold text-white">Organization name</p>
                  <p className="mt-0.5 text-sm text-white/60">
                    How your AI team will refer to your nonprofit.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-xl bg-white/5 border border-white/10 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#7C3AED]/20">
                  <Key className="h-5 w-5 text-[#8B5CF6]" />
                </div>
                <div>
                  <p className="font-semibold text-white">Your Anthropic API key</p>
                  <p className="mt-0.5 text-sm text-white/60">
                    BYOK — you control costs and data. Get one at{" "}
                    <a
                      href="https://console.anthropic.com"
                      target="_blank"
                      rel="noreferrer"
                      className="underline text-white/80 hover:text-white"
                    >
                      console.anthropic.com
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-white/40">
            Built for nonprofits by Edify, Beaufort SC.
          </p>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2 bg-[#1a2b32]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <Link href="/" className="flex items-center gap-2 no-underline">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7C3AED]">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Edify OS</span>
            </Link>
          </div>

          {/* Card */}
          <div className="bg-[#243b44] rounded-2xl border border-white/10 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
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
          </div>
        </div>
      </div>
    </div>
  );
}
