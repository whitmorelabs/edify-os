"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Heart,
  BookOpen,
  Users,
  Gift,
  Megaphone,
  Palette,
  UserCircle,
  Cog,
  HelpCircle,
  DollarSign,
  UserCheck,
  CalendarDays,
  Settings,
} from "lucide-react";
import Link from "next/link";
import type { MemoryEntryCategory, MemoryEntryRow } from "@/app/api/memory/entries/route";

const categoryConfig: Record<
  MemoryEntryCategory,
  { label: string; icon: typeof Heart }
> = {
  mission: { label: "Mission", icon: Heart },
  programs: { label: "Programs", icon: BookOpen },
  donors: { label: "Donors", icon: Users },
  grants: { label: "Grants", icon: Gift },
  campaigns: { label: "Campaigns", icon: Megaphone },
  brand_voice: { label: "Brand Voice", icon: Palette },
  contacts: { label: "Contacts", icon: UserCircle },
  processes: { label: "Processes", icon: Cog },
  general: { label: "General", icon: HelpCircle },
  financials: { label: "Financials", icon: DollarSign },
  volunteers: { label: "Volunteers", icon: UserCheck },
  events: { label: "Events", icon: CalendarDays },
};

function formatUpdatedAt(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return date.toLocaleDateString();
}

export default function MemoryPage() {
  const [activeCategory, setActiveCategory] = useState<MemoryEntryCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    title: "",
    content: "",
    category: "general" as MemoryEntryCategory,
  });

  const [entries, setEntries] = useState<MemoryEntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchEntries = () => {
    setLoading(true);
    setError(null);
    fetch("/api/memory/entries", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load memory");
        return res.json() as Promise<MemoryEntryRow[]>;
      })
      .then((data) => setEntries(data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load memory"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEntries();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddEntry = () => {
    if (!newEntry.title.trim() || !newEntry.content.trim()) return;
    setSaving(true);
    setSaveError(null);
    fetch("/api/memory/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: newEntry.category,
        title: newEntry.title.trim(),
        content: newEntry.content.trim(),
      }),
    })
      .then((res) => {
        if (!res.ok) return res.json().then((e: { error?: string }) => { throw new Error(e.error ?? "Save failed"); });
        return res.json() as Promise<MemoryEntryRow>;
      })
      .then(() => {
        setShowAddForm(false);
        setNewEntry({ title: "", content: "", category: "general" });
        fetchEntries();
      })
      .catch((err: unknown) => setSaveError(err instanceof Error ? err.message : "Save failed"))
      .finally(() => setSaving(false));
  };

  const categories = Object.entries(categoryConfig) as [
    MemoryEntryCategory,
    (typeof categoryConfig)[MemoryEntryCategory]
  ][];

  const filtered = entries.filter((e) => {
    if (activeCategory !== "all" && e.category !== activeCategory) return false;
    if (
      search &&
      !e.title.toLowerCase().includes(search.toLowerCase()) &&
      !e.content.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-1">Organization Memory</h1>
          <p className="mt-1 text-slate-500">
            The knowledge base your AI team uses to stay context-aware.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" />
          Add Entry
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="card p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="heading-3">New Memory Entry</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label mb-1.5 block">Title</label>
                <input
                  type="text"
                  value={newEntry.title}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, title: e.target.value })
                  }
                  className="input-field"
                  placeholder="Entry title..."
                />
              </div>
              <div>
                <label className="label mb-1.5 block">Category</label>
                <select
                  value={newEntry.category}
                  onChange={(e) =>
                    setNewEntry({
                      ...newEntry,
                      category: e.target.value as MemoryEntryCategory,
                    })
                  }
                  className="input-field"
                >
                  {categories.map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label mb-1.5 block">Content</label>
              <textarea
                value={newEntry.content}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, content: e.target.value })
                }
                className="input-field"
                rows={4}
                placeholder="What should your AI team know..."
              />
            </div>
            {saveError && (
              <p className="text-sm text-red-500">{saveError}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowAddForm(false); setSaveError(null); }}
                className="btn-secondary"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleAddEntry}
                className="btn-primary"
                disabled={saving || !newEntry.title.trim() || !newEntry.content.trim()}
              >
                {saving ? "Saving…" : "Save Entry"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search memory..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-9"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory("all")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
            activeCategory === "all"
              ? "bg-brand-500 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          All
        </button>
        {categories.map(([key, config]) => {
          const count = entries.filter((e) => e.category === key).length;
          return (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                activeCategory === key
                  ? "bg-brand-500 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <config.icon className="h-3.5 w-3.5" />
              {config.label}
              {count > 0 && (
                <span
                  className={`text-xs ${
                    activeCategory === key
                      ? "text-white/70"
                      : "text-slate-400"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Entries */}
      <div className="space-y-3">
        {loading ? (
          <>
            <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />
            <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />
            <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />
          </>
        ) : error ? (
          <div className="card p-12 text-center">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="card p-12 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-4 font-medium text-slate-700">No memory entries yet.</p>
            <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
              Your memory grows as you chat with your team, upload briefings, and customize their roles.
            </p>
            <Link
              href="/dashboard/settings"
              className="btn-secondary mt-4 inline-flex items-center gap-1.5"
            >
              <Settings className="h-4 w-4" />
              Go to Settings
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <Search className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">No entries found.</p>
          </div>
        ) : (
          filtered.map((entry) => {
            const catConfig = categoryConfig[entry.category] ?? categoryConfig.general;
            return (
              <div key={entry.id} className="card p-5 group">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                      <catConfig.icon className="h-4 w-4 text-brand-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">
                          {entry.title}
                        </h3>
                        {entry.autoGenerated && (
                          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">
                            AI Generated
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                        {entry.content}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                        <span>{catConfig.label}</span>
                        {entry.source && (
                          <span>From: {entry.source}</span>
                        )}
                        <span>Updated {formatUpdatedAt(entry.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                    <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
