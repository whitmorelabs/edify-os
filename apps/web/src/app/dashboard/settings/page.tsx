"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Key,
  Shield,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  Users,
  Building,
  Plus,
  Trash2,
  CreditCard,
  ArrowRight,
  Clock,
} from "lucide-react";

type AutonomyLevel = "suggestion" | "assisted" | "autonomous";

const autonomyLevels: {
  value: AutonomyLevel;
  label: string;
  description: string;
}[] = [
  {
    value: "suggestion",
    label: "Suggestion Mode",
    description: "All outputs require your approval before executing. Best for getting started.",
  },
  {
    value: "assisted",
    label: "Assisted Execution",
    description:
      "Low-risk tasks auto-execute. High-risk actions still need your approval.",
  },
  {
    value: "autonomous",
    label: "Autonomous Operations",
    description:
      "Agents operate within guardrails. You review summaries instead of individual actions.",
  },
];

const teamMembers = [
  { id: "1", name: "Sarah Chen", email: "sarah@hopefoundation.org", role: "Owner" },
  { id: "2", name: "Marcus Johnson", email: "marcus@hopefoundation.org", role: "Admin" },
  { id: "3", name: "Priya Patel", email: "priya@hopefoundation.org", role: "Member" },
];

export default function SettingsPage() {
  const [orgName, setOrgName] = useState("Hope Community Foundation");
  const [mission, setMission] = useState(
    "Empowering underserved communities through education, mentorship, and sustainable development programs."
  );
  const [website, setWebsite] = useState("https://hopecommunity.org");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeySet, setApiKeySet] = useState(false);
  const [autonomy, setAutonomy] = useState<AutonomyLevel>("suggestion");
  const [inviteEmail, setInviteEmail] = useState("");

  return (
    <div className="max-w-3xl space-y-8 animate-fade-in">
      <div>
        <h1 className="heading-1">Settings</h1>
        <p className="mt-1 text-slate-500">
          Manage your organization and AI team configuration.
        </p>
      </div>

      {/* Team Schedule (Heartbeats) */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
            <Clock className="h-5 w-5 text-brand-500" />
          </div>
          <div>
            <h2 className="heading-3">Your Team&apos;s Schedule</h2>
            <p className="text-sm text-slate-500">
              Configure proactive check-ins from each team member.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/settings/heartbeats"
          className="btn-secondary inline-flex items-center gap-1.5"
        >
          Configure Check-ins
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Billing & Subscription */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
            <CreditCard className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="heading-3">Billing &amp; Subscription</h2>
            <p className="text-sm text-slate-500">
              Starter plan &mdash; $49/mo
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/settings/billing"
          className="btn-secondary inline-flex items-center gap-1.5"
        >
          Manage Billing
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Organization Profile */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
            <Building className="h-5 w-5 text-brand-500" />
          </div>
          <div>
            <h2 className="heading-3">Organization Profile</h2>
            <p className="text-sm text-slate-500">Basic info about your nonprofit.</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label mb-1.5 block">Organization Name</label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label mb-1.5 block">Mission Statement</label>
            <textarea
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              rows={3}
              className="input-field"
            />
          </div>
          <div>
            <label className="label mb-1.5 block">Website</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="flex justify-end">
            <button className="btn-primary">
              <Check className="h-4 w-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* API Key (BYOK) */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
            <Key className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="heading-3">Anthropic API Key</h2>
            <p className="text-sm text-slate-500">
              Bring your own key to power your AI team.
            </p>
          </div>
        </div>

        <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Why Bring Your Own Key?</p>
              <p className="mt-1 text-amber-700">
                Your API key is encrypted at rest and never shared. You control
                your AI usage and costs directly through your Anthropic account.
              </p>
            </div>
          </div>
        </div>

        {apiKeySet ? (
          <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-sm font-medium text-emerald-800">
                  API key configured
                </p>
                <p className="text-xs text-emerald-600">
                  sk-ant-...{apiKey.slice(-8) || "xxxx"}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setApiKeySet(false);
                setApiKey("");
              }}
              className="text-sm font-medium text-red-600 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-api03-..."
                className="input-field pr-10 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <button
              onClick={() => apiKey && setApiKeySet(true)}
              disabled={!apiKey}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Key className="h-4 w-4" />
              Save & Validate Key
            </button>
          </div>
        )}
      </div>

      {/* Autonomy Level */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
            <Shield className="h-5 w-5 text-brand-500" />
          </div>
          <div>
            <h2 className="heading-3">Autonomy Level</h2>
            <p className="text-sm text-slate-500">
              How much control your AI team has.
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          {autonomyLevels.map((level) => (
            <button
              key={level.value}
              onClick={() => setAutonomy(level.value)}
              className={`flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                autonomy === level.value
                  ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/20"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div
                className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                  autonomy === level.value
                    ? "border-brand-500 bg-brand-500"
                    : "border-slate-300"
                }`}
              >
                {autonomy === level.value && (
                  <Check className="h-3 w-3 text-white" />
                )}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{level.label}</p>
                <p className="mt-0.5 text-sm text-slate-500">
                  {level.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Team Management */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50">
            <Users className="h-5 w-5 text-sky-600" />
          </div>
          <div>
            <h2 className="heading-3">Team Members</h2>
            <p className="text-sm text-slate-500">
              People who can access this organization.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                  {member.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {member.name}
                  </p>
                  <p className="text-xs text-slate-500">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    member.role === "Owner"
                      ? "bg-brand-50 text-brand-700"
                      : member.role === "Admin"
                      ? "bg-sky-50 text-sky-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {member.role}
                </span>
                {member.role !== "Owner" && (
                  <button className="text-slate-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@nonprofit.org"
            className="input-field flex-1"
          />
          <button className="btn-secondary">
            <Plus className="h-4 w-4" />
            Invite
          </button>
        </div>
      </div>
    </div>
  );
}
