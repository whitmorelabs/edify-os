"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { GlobalSettings } from "./components/GlobalSettings";
import { ArchetypeScheduleRow } from "./components/ArchetypeScheduleRow";
import { ARCHETYPE_CONFIG, ARCHETYPE_SLUGS } from "@/lib/archetype-config";
import {
  getHeartbeatConfig,
  updateArchetypeConfig,
  toggleAllHeartbeats,
  type OrgHeartbeatSettings,
  type HeartbeatConfig,
  type ArchetypeSlug,
} from "@/app/dashboard/inbox/heartbeats";

type SaveState = "idle" | "saving" | "saved";

export default function HeartbeatsSettingsPage() {
  const [settings, setSettings] = useState<OrgHeartbeatSettings | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [pendingChanges, setPendingChanges] = useState<Set<ArchetypeSlug>>(new Set());

  useEffect(() => {
    getHeartbeatConfig().then(setSettings);
  }, []);

  const handleGlobalEnabledChange = useCallback(
    async (enabled: boolean) => {
      if (!settings) return;
      setSettings((prev) => prev && { ...prev, enabled });
      setSaveState("saving");
      await toggleAllHeartbeats(enabled);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    },
    [settings]
  );

  const handleGlobalFieldChange = useCallback(
    (field: "timezone" | "emailDigest" | "digestTime", value: string | boolean) => {
      setSettings((prev) => prev && { ...prev, [field]: value });
    },
    []
  );

  const handleArchetypeChange = useCallback(
    (archetype: ArchetypeSlug, updates: Partial<HeartbeatConfig>) => {
      setSettings((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          archetypes: {
            ...prev.archetypes,
            [archetype]: { ...prev.archetypes[archetype], ...updates },
          },
        };
      });
      setPendingChanges((prev) => new Set(prev).add(archetype));
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (!settings) return;
    setSaveState("saving");

    await Promise.all(
      Array.from(pendingChanges).map((archetype) =>
        updateArchetypeConfig(archetype, settings.archetypes[archetype])
      )
    );

    setPendingChanges(new Set());
    setSaveState("saved");
    setTimeout(() => setSaveState("idle"), 2000);
  }, [settings, pendingChanges]);

  if (!settings) {
    return (
      <div className="max-w-3xl space-y-4 animate-fade-in">
        <div className="h-8 w-64 bg-slate-100 rounded-lg animate-pulse" />
        <div className="h-48 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-32 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>
        <h1 className="heading-1">Your Team&apos;s Schedule</h1>
        <p className="mt-1 text-slate-500">
          Configure how often each team member checks in with you.
        </p>
      </div>

      {/* Global settings */}
      <GlobalSettings
        enabled={settings.enabled}
        timezone={settings.timezone}
        emailDigest={settings.emailDigest}
        digestTime={settings.digestTime}
        onEnabledChange={handleGlobalEnabledChange}
        onTimezoneChange={(v) => handleGlobalFieldChange("timezone", v)}
        onEmailDigestChange={(v) => handleGlobalFieldChange("emailDigest", v)}
        onDigestTimeChange={(v) => handleGlobalFieldChange("digestTime", v)}
      />

      {/* Per-archetype rows */}
      <div>
        <h2 className="heading-2 mb-3">Team members</h2>
        <div className="space-y-3">
          {ARCHETYPE_SLUGS.map((slug) => (
            <ArchetypeScheduleRow
              key={slug}
              meta={ARCHETYPE_CONFIG[slug]}
              config={settings.archetypes[slug]}
              globalEnabled={settings.enabled}
              onChange={(updates) => handleArchetypeChange(slug, updates)}
            />
          ))}
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center justify-end gap-3 pb-8">
        {saveState === "saved" && (
          <span className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
            <Check className="h-4 w-4" />
            Saved
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saveState === "saving" || pendingChanges.size === 0}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saveState === "saving" ? (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Save Schedule
            </>
          )}
        </button>
      </div>
    </div>
  );
}
