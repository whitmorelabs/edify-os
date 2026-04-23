"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building, Mail, Lock, ArrowRight } from "lucide-react";
import { signUp } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!isSupabaseConfigured()) {
      router.push("/onboarding");
      return;
    }

    const { error: authError } = await signUp(email, password, orgName);

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/onboarding");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
        Hire your AI team
      </h1>
      <p className="text-sm text-white/50 mb-8">
        Set up your organization in under 2 minutes.
      </p>

      {error && (
        <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
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
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 pl-10 text-sm text-white placeholder:text-white/25 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-white/50 mb-1.5">
            Work Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@nonprofit.org"
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 pl-10 text-sm text-white placeholder:text-white/25 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-white/50 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              required
              minLength={8}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 pl-10 text-sm text-white placeholder:text-white/25 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-[10px] bg-brand-500 px-6 py-3 text-sm font-semibold text-[var(--fg-on-purple)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all duration-200 disabled:opacity-50"
        >
          {loading ? "Creating your team..." : "Create Account"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-white/30">
        By creating an account, you agree to our Terms of Service and Privacy Policy.
      </p>

      {process.env.NEXT_PUBLIC_DEMO_MODE === "true" && (
        <>
          <div className="mt-4 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-white/30">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <Link
            href="/dashboard?demo=true"
            className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-brand-500 hover:bg-white/5 transition-all duration-150"
          >
            Skip to Demo Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </>
      )}

      <p className="mt-4 text-center text-sm text-white/40">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-brand-500 hover:opacity-70"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
