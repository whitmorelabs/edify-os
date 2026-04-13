"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { signInWithEmail } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!isSupabaseConfigured()) {
      router.push("/dashboard");
      return;
    }

    const { error: authError } = await signInWithEmail(email, password);

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
        Welcome back
      </h1>
      <p className="text-sm text-white/50 mb-8">
        Sign in to your Edify OS dashboard.
      </p>

      {error && (
        <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-white/50 mb-1.5">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@nonprofit.org"
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 pl-10 text-sm text-white placeholder:text-white/25 focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 transition-colors"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-white/50">
              Password
            </label>
            <a
              href="#"
              className="text-xs font-medium text-[#8B5CF6] hover:text-[#a78bfa]"
            >
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              minLength={8}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 pl-10 text-sm text-white placeholder:text-white/25 focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#7C3AED] px-6 py-3 text-sm font-semibold text-white hover:bg-[#8B5CF6] active:bg-[#6D28D9] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50 focus:ring-offset-2 focus:ring-offset-[#243b44] transition-all duration-200 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <div className="mt-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-white/30">or</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <Link
        href="/dashboard"
        className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-[#8B5CF6] hover:bg-white/5 transition-all duration-150"
      >
        Skip to Demo Dashboard
        <ArrowRight className="h-4 w-4" />
      </Link>

      <p className="mt-6 text-center text-sm text-white/40">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-semibold text-[#8B5CF6] hover:text-[#a78bfa]"
        >
          Create one free
        </Link>
      </p>
    </div>
  );
}
