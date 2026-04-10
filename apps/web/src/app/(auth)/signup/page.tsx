"use client";

import { useState } from "react";
import Link from "next/link";
import { Building, Mail, Lock, ArrowRight, Sparkles } from "lucide-react";

export default function SignupPage() {
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    // TODO: Supabase auth + org creation
    setTimeout(() => {
      window.location.href = "/onboarding";
    }, 500);
  };

  return (
    <div className="animate-fade-in">
      {/* Mobile Logo */}
      <div className="mb-8 flex items-center gap-2 lg:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-bold text-slate-900">Edify OS</span>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Hire your AI team
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Set up your organization in under 2 minutes.
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="label mb-1.5 block">Organization Name</label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Hope Community Foundation"
              required
              className="input-field pl-10"
            />
          </div>
        </div>

        <div>
          <label className="label mb-1.5 block">Work Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@nonprofit.org"
              required
              className="input-field pl-10"
            />
          </div>
        </div>

        <div>
          <label className="label mb-1.5 block">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              required
              minLength={8}
              className="input-field pl-10"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full disabled:opacity-50"
        >
          {loading ? "Creating your team..." : "Create Account"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-400">
        By creating an account, you agree to our Terms of Service and Privacy
        Policy.
      </p>

      <div className="mt-4 flex items-center gap-4">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-400">or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <Link
        href="/dashboard"
        className="btn-ghost mt-4 w-full text-brand-500 hover:bg-brand-50"
      >
        Skip to Demo Dashboard
        <ArrowRight className="h-4 w-4" />
      </Link>

      <p className="mt-4 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-brand-500 hover:text-brand-600"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
