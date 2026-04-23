"use client";

import { useEffect, useState } from "react";
import {
  Landmark,
  Megaphone,
  CalendarCheck,
  BookOpen,
  UserCheck,
  CalendarDays,
  Key,
  Eye,
  EyeOff,
  Check,
  ChevronDown,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getApiKey, setApiKey, clearApiKey, hasApiKey } from "@/lib/api-key";

interface ArchetypeConfig {
  slug: string;
  label: string;
  enabled: boolean;
  autonomyLevel: "suggestion" | "assisted" | "autonomous";
  personaOverrides: string;
}

interface ProviderConfig {
  provider: string;
  accessKeySet: boolean;
  accessKeyPreview: string;
}

const ARCHETYPE_ICONS: Record<string, LucideIcon> = {
  development_director: Landmark,
  marketing_director: Megaphone,
  executive_assistant: CalendarCheck,
  programs_director: BookOpen,
  hr_volunteer_coordinator: UserCheck,
  events_director: CalendarDays,
};

const ARCHETYPE_COLORS: Record<string, string> = {
  development_director: "bg-emerald-50 text-emerald-600",
  marketing_director: "bg-amber-50 text-amber-600",
  executive_assistant: "bg-sky-50 text-sky-600",
  programs_director: "bg-violet-50 text-violet-600",
  hr_volunteer_coordinator: "bg-indigo-50 text-indigo-600",
  events_director: "bg-rose-50 text-rose-600",
};

const autonomyOptions = [
  { value: "suggestion", label: "Suggest only", description: "All outputs need your review." },
  { value: "assisted", label: "Assist (ask before acting)", description: "Runs low-risk tasks; asks for approval on bigger ones." },
  { value: "autonomous", label: "Autonomous (act independently)", description: "Works within guardrails; you review summaries." },
] as const;

const providers = ["Claude (Anthropic)", "OpenAI", "Qwen", "Mistral"];

const DEFAULT_ARCHETYPES: ArchetypeConfig[] = [
  { slug: "development_director", label: "Director of Development", enabled: true, autonomyLevel: "suggestion", personaOverrides: "" },
  { slug: "marketing_director", label: "Marketing Director", enabled: true, autonomyLevel: "suggestion", personaOverrides: "" },
  { slug: "executive_assistant", label: "Executive Assistant", enabled: true, autonomyLevel: "suggestion", personaOverrides: "" },
  { slug: "programs_director", label: "Programs Director", enabled: true, autonomyLevel: "suggestion", personaOverrides: "" },
  { slug: "hr_volunteer_coordinator", label: "HR & Volunteer Coordinator", enabled: true, autonomyLevel: "suggestion", personaOverrides: "" },
  { slug: "events_director", label: "Events Director", enabled: true, autonomyLevel: "suggestion", personaOverrides: "" },
];

const ARCHETYPES_STORAGE_KEY = "edify_archetype_config";

export default function AIConfigPage() {
  const [archetypes, setArchetypes] = useState<ArchetypeConfig[]>(DEFAULT_ARCHETYPES);
  const [provider, setProvider] = useState<ProviderConfig>({
    provider: "Claude (Anthropic)",
    accessKeySet: false,
    accessKeyPreview: "",
  });

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);

  const [accessKey, setAccessKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "ok" | "fail">("idle");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Load saved config from localStorage on mount
  useEffect(() => {
    try {
      const savedArchetypes = localStorage.getItem(ARCHETYPES_STORAGE_KEY);
      if (savedArchetypes) {
        setArchetypes(JSON.parse(savedArchetypes));
      }

      const savedKey = getApiKey();
      if (savedKey) {
        const preview = savedKey.slice(0, 12) + "..." + savedKey.slice(-4);
        setProvider({
          provider: "Claude (Anthropic)",
          accessKeySet: true,
          accessKeyPreview: preview,
        });
      }
    } catch {
      // ignore
    }
  }, []);

  function updateArchetype(slug: string, patch: Partial<ArchetypeConfig>) {
    setArchetypes((prev) => prev.map((a) => (a.slug === slug ? { ...a, ...patch } : a)));
  }

  async function handleSave() {
    setSaveStatus("saving");
    try {
      // Save archetype config to localStorage
      localStorage.setItem(ARCHETYPES_STORAGE_KEY, JSON.stringify(archetypes));

      // Save API key if one was entered
      if (accessKey.trim()) {
        setApiKey(accessKey.trim());
        const preview = accessKey.trim().slice(0, 12) + "..." + accessKey.trim().slice(-4);
        setProvider((p) => ({ ...p, accessKeySet: true, accessKeyPreview: preview }));
        setAccessKey("");
      }

      setSaveStatus("saved");
    } catch {
      setSaveStatus("idle");
    }
    setTimeout(() => setSaveStatus("idle"), 2500);
  }

  function handleClearKey() {
    clearApiKey();
    setAccessKey("");
    setProvider((p) => ({ ...p, accessKeySet: false, accessKeyPreview: "" }));
  }

  async function handleTestConnection() {
    const keyToTest = accessKey.trim() || getApiKey();
    if (!keyToTest) {
      setTestStatus("fail");
      setTimeout(() => setTestStatus("idle"), 3000);
      return;
    }
    setTestStatus("testing");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": keyToTest,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 16,
          messages: [{ role: "user", content: "Say OK" }],
        }),
      });
      setTestStatus(res.ok ? "ok" : "fail");
    } catch {
      setTestStatus("fail");
    }
    setTimeout(() => setTestStatus("idle"), 3000);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="heading-1">AI Configuration</h1>
        <p className="text-sm text-fg-3 mt-0.5">
          Control which team members are active, how much autonomy they have, and any custom instructions.
        </p>
      </div>

      {/* Per-archetype settings */}
      <div className="space-y-4">
        {archetypes.map((archetype) => {
          const Icon = ARCHETYPE_ICONS[archetype.slug] || Landmark;
          const colorClass = ARCHETYPE_COLORS[archetype.slug] || "bg-bg-3 text-fg-3";
          const isAutonomyOpen = openDropdown === `autonomy-${archetype.slug}`;

          return (
            <div
              key={archetype.slug}
              className={cn(
                "card p-5 transition-opacity",
                !archetype.enabled && "opacity-60"
              )}
            >
              {/* Row 1: icon, name, toggle */}
              <div className="flex items-center gap-4 mb-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-fg-1">{archetype.label}</p>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => updateArchetype(archetype.slug, { enabled: !archetype.enabled })}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none",
                    archetype.enabled ? "bg-brand-500" : "bg-slate-200"
                  )}
                  role="switch"
                  aria-checked={archetype.enabled}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                      archetype.enabled ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>

              {archetype.enabled && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Autonomy level */}
                  <div>
                    <label className="label mb-1.5 block">Autonomy Level</label>
                    <div className="relative">
                      <button
                        onClick={() => setOpenDropdown(isAutonomyOpen ? null : `autonomy-${archetype.slug}`)}
                        className="w-full flex items-center justify-between rounded-lg border border-bg-3 bg-bg-3 px-3.5 py-2.5 text-sm text-fg-1 hover:bg-bg-2 transition-colors"
                      >
                        <span>{autonomyOptions.find((o) => o.value === archetype.autonomyLevel)?.label}</span>
                        <ChevronDown className={cn("h-4 w-4 text-fg-4 transition-transform", isAutonomyOpen && "rotate-180")} />
                      </button>

                      {isAutonomyOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
                          <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-lg border border-bg-3 bg-bg-3 py-1 shadow-elev-3">
                            {autonomyOptions.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => {
                                  updateArchetype(archetype.slug, { autonomyLevel: opt.value });
                                  setOpenDropdown(null);
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-bg-2 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-fg-1">{opt.label}</span>
                                  {archetype.autonomyLevel === opt.value && <Check className="h-4 w-4 text-brand-500" />}
                                </div>
                                <p className="text-xs text-fg-3 mt-0.5">{opt.description}</p>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Persona overrides */}
                  <div>
                    <label className="label mb-1.5 block">Custom Instructions</label>
                    <textarea
                      value={archetype.personaOverrides}
                      onChange={(e) => updateArchetype(archetype.slug, { personaOverrides: e.target.value })}
                      rows={2}
                      placeholder={`e.g., "Always mention our annual gala when talking to donors."`}
                      className="input-field resize-none text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Provider settings */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
            <Key className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="heading-3">AI Provider</h2>
            <p className="text-sm text-fg-3">Configure which provider powers your team.</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Provider selector */}
          <div>
            <label className="label mb-1.5 block">Provider</label>
            <div className="relative">
              <button
                onClick={() => setProviderDropdownOpen(!providerDropdownOpen)}
                className="w-full flex items-center justify-between rounded-lg border border-bg-3 bg-bg-3 px-3.5 py-2.5 text-sm text-fg-1 hover:bg-bg-2 transition-colors max-w-sm"
              >
                <span>{provider?.provider || "Select provider"}</span>
                <ChevronDown className={cn("h-4 w-4 text-fg-4 transition-transform", providerDropdownOpen && "rotate-180")} />
              </button>
              {providerDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProviderDropdownOpen(false)} />
                  <div className="absolute left-0 top-full mt-1 z-20 w-64 rounded-lg border border-bg-3 bg-bg-3 py-1 shadow-elev-3">
                    {providers.map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          setProvider((prev) => ({ ...prev, provider: p }));
                          setProviderDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 flex items-center justify-between"
                      >
                        {p}
                        {provider?.provider === p && <Check className="h-4 w-4 text-brand-500" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Access key */}
          <div className="max-w-sm">
            <label className="label mb-1.5 block">Access Key</label>
            {provider?.accessKeySet && !accessKey ? (
              <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium text-emerald-800">Key saved</p>
                    <p className="text-xs text-emerald-600 font-mono">{provider.accessKeyPreview}</p>
                  </div>
                </div>
                <button
                  onClick={handleClearKey}
                  className="text-xs font-medium text-red-600 hover:text-red-700"
                >
                  Replace
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  placeholder="sk-ant-api03-..."
                  className="input-field pr-10 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-4 hover:text-fg-2"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            )}
          </div>

          {/* Test connection */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleTestConnection}
              disabled={testStatus === "testing"}
              className="btn-secondary py-2 px-4 text-sm disabled:opacity-60"
            >
              {testStatus === "testing" ? "Testing..." : "Test Connection"}
            </button>
            {testStatus === "ok" && (
              <div className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                <Check className="h-4 w-4" />
                Connection successful
              </div>
            )}
            {testStatus === "fail" && (
              <div className="flex items-center gap-1.5 text-sm text-red-600 font-medium">
                <AlertTriangle className="h-4 w-4" />
                Connection failed
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saveStatus === "saving"}
          className="btn-primary disabled:opacity-60"
        >
          {saveStatus === "saving" ? (
            "Saving..."
          ) : saveStatus === "saved" ? (
            <>
              <Check className="h-4 w-4" />
              Saved
            </>
          ) : (
            "Save Configuration"
          )}
        </button>
      </div>
    </div>
  );
}
