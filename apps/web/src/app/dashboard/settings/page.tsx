"use client";

import { useState, useEffect } from "react";
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
  FileText,
  Pencil,
  Loader2,
  Plug,
} from "lucide-react";
import { useArchetypeNames } from "@/hooks/useArchetypeNames";
import { ARCHETYPE_CONFIG, ARCHETYPE_SLUGS } from "@/lib/archetype-config";
import type { OrgDetails } from "@/app/api/org/route";
import type { OrgMember } from "@/app/api/org/members/route";

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
      "Low-risk tasks run automatically. High-risk actions still need your approval.",
  },
  {
    value: "autonomous",
    label: "Autonomous Operations",
    description:
      "Your team operates within guardrails. You review summaries instead of individual actions.",
  },
];

export default function SettingsPage() {
  // --- Org info (real data) ---
  const [orgData, setOrgData] = useState<OrgDetails | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [orgName, setOrgName] = useState("");
  const [mission, setMission] = useState("");
  const [orgSaveState, setOrgSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // --- Members (real data) ---
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [membersLoading, setMembersLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // --- Other existing state ---
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeySet, setApiKeySet] = useState(false);
  const [autonomy, setAutonomy] = useState<AutonomyLevel>("suggestion");

  // Fetch org details on mount
  useEffect(() => {
    async function loadOrg() {
      try {
        const res = await fetch("/api/org");
        if (res.ok) {
          const data = (await res.json()) as OrgDetails;
          setOrgData(data);
          setOrgName(data.name ?? "");
          setMission(data.mission ?? "");
          if (data.anthropic_api_key_hint) {
            setApiKeySet(true);
          }
        }
      } catch {
        // Non-fatal — show empty fields
      } finally {
        setOrgLoading(false);
      }
    }
    loadOrg();
  }, []);

  // Fetch members on mount
  useEffect(() => {
    async function loadMembers() {
      try {
        const res = await fetch("/api/org/members");
        if (res.ok) {
          const data = await res.json() as { members: OrgMember[]; currentUserId: string };
          setMembers(data.members ?? []);
          setCurrentUserId(data.currentUserId ?? null);
        }
      } catch {
        // Non-fatal — show empty list
      } finally {
        setMembersLoading(false);
      }
    }
    loadMembers();
  }, []);

  async function handleSaveOrgProfile() {
    setOrgSaveState("saving");
    try {
      const res = await fetch("/api/org", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName, mission }),
      });
      if (!res.ok) {
        throw new Error("Save failed");
      }
      const updated = (await res.json()) as OrgDetails;
      setOrgData(updated);
      setOrgSaveState("saved");
      setTimeout(() => setOrgSaveState("idle"), 2000);
    } catch {
      setOrgSaveState("error");
      setTimeout(() => setOrgSaveState("idle"), 3000);
    }
  }

  // Custom archetype names
  const { names: archetypeNames, updateName } = useArchetypeNames();
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const [nameSaveState, setNameSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  function getDraftName(slug: string): string {
    if (slug in draftNames) return draftNames[slug];
    return archetypeNames[slug] ?? "";
  }

  async function handleSaveNames() {
    setNameSaveState("saving");
    try {
      await Promise.all(
        ARCHETYPE_SLUGS.map((slug) => {
          const draft = draftNames[slug];
          // Only send slugs that have been explicitly changed in this session
          if (draft === undefined) return Promise.resolve();
          return updateName(slug, draft || null);
        })
      );
      setDraftNames({});
      setNameSaveState("saved");
      setTimeout(() => setNameSaveState("idle"), 2000);
    } catch {
      setNameSaveState("error");
      setTimeout(() => setNameSaveState("idle"), 3000);
    }
  }

  return (
    <div className="max-w-3xl space-y-8 animate-fade-in">
      <div>
        <h1 className="heading-1">Settings</h1>
        <p className="mt-1 text-fg-3">
          Manage your organization and AI team configuration.
        </p>
      </div>

      {/* Organization Briefing */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100">
            <FileText className="h-5 w-5 text-brand-500" />
          </div>
          <div>
            <h2 className="heading-3">Organization Briefing</h2>
            <p className="text-sm text-fg-3">
              Update your organization&apos;s profile and documents so your team stays current.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/briefing"
          className="btn-secondary inline-flex items-center gap-1.5"
        >
          Update Briefing
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Team Schedule (Heartbeats) */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100">
            <Clock className="h-5 w-5 text-brand-500" />
          </div>
          <div>
            <h2 className="heading-3">Your Team&apos;s Schedule</h2>
            <p className="text-sm text-fg-3">
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

      {/* MCP Integrations */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/15">
            <Plug className="h-5 w-5 text-brand-500" />
          </div>
          <div>
            <h2 className="heading-3">MCP Integrations</h2>
            <p className="text-sm text-fg-3">
              Connect tools your AI team uses as live actions — Canva, Figma, and more.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/integrations"
          className="btn-secondary inline-flex items-center gap-1.5"
        >
          Manage Integrations
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Rename Your Team */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
            <Pencil className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h2 className="heading-3">Rename your team</h2>
            <p className="text-sm text-fg-3">
              Give each AI team member a personal name. They&apos;ll introduce themselves by it in chat.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {ARCHETYPE_SLUGS.map((slug) => {
            const config = ARCHETYPE_CONFIG[slug];
            return (
              <div key={slug} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                <label className="sm:w-44 shrink-0 text-sm font-medium text-fg-1 truncate">
                  {config.label}
                </label>
                <input
                  type="text"
                  value={getDraftName(slug)}
                  onChange={(e) =>
                    setDraftNames((prev) => ({ ...prev, [slug]: e.target.value }))
                  }
                  placeholder={config.label}
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  className="input-field flex-1"
                />
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-fg-4">
            Leave a field blank to use the default role title.
          </p>
          <button
            onClick={handleSaveNames}
            disabled={nameSaveState === "saving" || Object.keys(draftNames).length === 0}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {nameSaveState === "saving" ? (
              "Saving..."
            ) : nameSaveState === "saved" ? (
              <>
                <Check className="h-4 w-4" />
                Saved
              </>
            ) : nameSaveState === "error" ? (
              "Error — try again"
            ) : (
              <>
                <Check className="h-4 w-4" />
                Save Names
              </>
            )}
          </button>
        </div>
      </div>

      {/* Billing & Subscription */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
            <CreditCard className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="heading-3">Billing &amp; Subscription</h2>
            <p className="text-sm text-fg-3">
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100">
            <Building className="h-5 w-5 text-brand-500" />
          </div>
          <div>
            <h2 className="heading-3">Organization Profile</h2>
            <p className="text-sm text-fg-3">Basic info about your organization.</p>
          </div>
        </div>
        {orgLoading ? (
          <div className="flex items-center gap-2 text-fg-4 text-sm py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="label mb-1.5 block">Organization Name</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Your organization name"
                className="input-field"
              />
            </div>
            <div>
              <label className="label mb-1.5 block">Mission Statement</label>
              <textarea
                value={mission}
                onChange={(e) => setMission(e.target.value)}
                rows={3}
                placeholder="Describe your organization's mission…"
                className="input-field"
              />
            </div>
            {orgData?.plan && (
              <div>
                <label className="label mb-1.5 block">Plan</label>
                <p className="text-sm text-fg-1 capitalize">{orgData.plan}</p>
              </div>
            )}
            <div className="flex justify-end">
              <button
                onClick={handleSaveOrgProfile}
                disabled={orgSaveState === "saving"}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {orgSaveState === "saving" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : orgSaveState === "saved" ? (
                  <>
                    <Check className="h-4 w-4" />
                    Saved
                  </>
                ) : orgSaveState === "error" ? (
                  "Error — try again"
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Anthropic Key (BYOK) */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
            <Key className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="heading-3">Anthropic Access Key</h2>
            <p className="text-sm text-fg-3">
              Bring your own key to power your AI team.
            </p>
          </div>
        </div>

        <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Why bring your own key?</p>
              <p className="mt-1 text-amber-700">
                Your access key is encrypted at rest and never shared. You control
                your AI usage and costs directly through your Anthropic account.
              </p>
            </div>
          </div>
        </div>

        {apiKeySet ? (
          <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-emerald-700">
                  Access key saved
                </p>
                <p className="text-xs text-emerald-600">
                  sk-ant-...{orgData?.anthropic_api_key_hint ?? (apiKey.slice(-4) || "xxxx")}
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/admin/ai-config"
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Manage Key
            </Link>
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-4 hover:text-fg-2"
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100">
            <Shield className="h-5 w-5 text-brand-500" />
          </div>
          <div>
            <h2 className="heading-3">Autonomy Level</h2>
            <p className="text-sm text-fg-3">
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
                  ? "border-brand-500 bg-brand-500/10 ring-2 ring-brand-500/20"
                  : "border-bg-3 hover:border-bg-3/80"
              }`}
            >
              <div
                className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                  autonomy === level.value
                    ? "border-brand-500 bg-brand-500"
                    : "border-fg-4"
                }`}
              >
                {autonomy === level.value && (
                  <Check className="h-3 w-3 text-white" />
                )}
              </div>
              <div>
                <p className="font-semibold text-fg-1">{level.label}</p>
                <p className="mt-0.5 text-sm text-fg-3">
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100">
            <Users className="h-5 w-5 text-sky-600" />
          </div>
          <div>
            <h2 className="heading-3">Team Members</h2>
            <p className="text-sm text-fg-3">
              People who can access this organization.
            </p>
          </div>
        </div>

        {membersLoading ? (
          <div className="flex items-center gap-2 text-fg-4 text-sm py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : members.length === 0 ? (
          <p className="text-sm text-fg-4 py-2">No members found.</p>
        ) : (
          <div className="space-y-3">
            {members.map((member) => {
              const isYou = member.userId === currentUserId;
              const roleCapitalized =
                member.role.charAt(0).toUpperCase() + member.role.slice(1);
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border border-bg-3 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500/20 text-sm font-bold text-brand-700">
                      {member.avatarInitials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-fg-1 flex items-center gap-1.5">
                        {member.name}
                        {isYou && (
                          <span className="rounded-full bg-brand-500/20 px-1.5 py-0.5 text-xs font-medium text-brand-700">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-fg-3">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        member.role === "owner"
                          ? "bg-brand-500/20 text-brand-700"
                          : member.role === "admin"
                          ? "bg-sky-100 text-sky-700"
                          : "bg-bg-3 text-fg-3"
                      }`}
                    >
                      {roleCapitalized}
                    </span>
                    {member.role !== "owner" && !isYou && (
                      <button
                        className="text-fg-4 hover:text-red-500"
                        title="Remove member (coming soon)"
                        disabled
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4">
          <button
            onClick={() => setShowInviteModal(true)}
            className="btn-secondary"
          >
            <Plus className="h-4 w-4" />
            Invite Member
          </button>
        </div>
      </div>

      {/* Invite modal (stub) */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="card w-full max-w-sm p-6 space-y-4">
            <h3 className="heading-3">Invite a Team Member</h3>
            <p className="text-sm text-fg-3">
              Team invites are coming soon. You&apos;ll be able to invite colleagues by email once this feature launches.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowInviteModal(false)}
                className="btn-primary"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
