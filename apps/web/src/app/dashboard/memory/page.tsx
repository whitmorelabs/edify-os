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

type FormMode = { kind: "add" } | { kind: "edit"; entry: MemoryEntryRow };

const EMPTY_FORM = { title: "", content: "", category: "general" as MemoryEntryCategory };

export default function MemoryPage() {
  const [activeCategory, setActiveCategory] = useState<MemoryEntryCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const [entries, setEntries] = useState<MemoryEntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Delete confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const openAddForm = () => {
    setFormMode({ kind: "add" });
    setFormData(EMPTY_FORM);
    setSaveError(null);
  };

  const openEditForm = (entry: MemoryEntryRow) => {
    setFormMode({ kind: "edit", entry });
    setFormData({
      title: entry.title,
      content: entry.content,
      category: entry.category,
    });
    setSaveError(null);
  };

  const closeForm = () => {
    setFormMode(null);
    setSaveError(null);
  };

  const handleSave = () => {
    if (!formData.title.trim() || !formData.content.trim()) return;
    setSaving(true);
    setSaveError(null);

    const url = formMode?.kind === "edit"
      ? `/api/memory/entries/${formMode.entry.id}`
      : "/api/memory/entries";
    const method = formMode?.kind === "edit" ? "PATCH" : "POST";

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: formData.category,
        title: formData.title.trim(),
        content: formData.content.trim(),
      }),
    })
      .then((res) => {
        if (!res.ok) return res.json().then((e: { error?: string }) => { throw new Error(e.error ?? "Save failed"); });
        return res.json() as Promise<MemoryEntryRow>;
      })
      .then(() => {
        closeForm();
        fetchEntries();
      })
      .catch((err: unknown) => setSaveError(err instanceof Error ? err.message : "Save failed"))
      .finally(() => setSaving(false));
  };

  const handleDeleteConfirm = (id: string) => {
    setDeletingId(id);
    setDeleteError(null);
    fetch(`/api/memory/entries/${id}`, { method: "DELETE" })
      .then((res) => {
        if (!res.ok && res.status !== 204) {
          return res.json().then((e: { error?: string }) => { throw new Error(e.error ?? "Delete failed"); });
        }
      })
      .then(() => {
        setDeletingId(null);
        setEntries((prev) => prev.filter((e) => e.id !== id));
      })
      .catch((err: unknown) => {
        setDeleteError(err instanceof Error ? err.message : "Delete failed");
        setDeletingId(null);
      });
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

  const isEditing = formMode?.kind === "edit";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-1">Organization memory</h1>
          <p className="mt-1 text-fg-3">
            The knowledge base your AI team uses to stay context-aware.
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" />
          Add Entry
        </button>
      </div>

      {/* Add / Edit Form */}
      {formMode !== null && (
        <div className="card p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="heading-3">{isEditing ? "Edit Memory Entry" : "New Memory Entry"}</h3>
            <button
              onClick={closeForm}
              className="text-fg-4 hover:text-fg-2"
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
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  placeholder="Entry title..."
                />
              </div>
              <div>
                <label className="label mb-1.5 block">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as MemoryEntryCategory })
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
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
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
                onClick={closeForm}
                className="btn-secondary"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="btn-primary"
                disabled={saving || !formData.title.trim() || !formData.content.trim()}
              >
                {saving ? "Saving…" : isEditing ? "Save Changes" : "Save Entry"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete error banner */}
      {deleteError && (
        <div className="rounded-lg bg-red-950/40 border border-red-500/30 p-3 text-sm text-red-400 flex items-center justify-between">
          <span>{deleteError}</span>
          <button onClick={() => setDeleteError(null)} className="ml-3 text-red-400 hover:text-red-300">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-4" />
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
              : "bg-bg-3 text-fg-2 hover:bg-bg-2"
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
                  : "bg-bg-3 text-fg-2 hover:bg-bg-2"
              }`}
            >
              <config.icon className="h-3.5 w-3.5" />
              {config.label}
              {count > 0 && (
                <span
                  className={`text-xs ${
                    activeCategory === key
                      ? "text-white/70"
                      : "text-fg-4"
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
            <div className="h-24 rounded-xl bg-bg-3 animate-pulse" />
            <div className="h-24 rounded-xl bg-bg-3 animate-pulse" />
            <div className="h-24 rounded-xl bg-bg-3 animate-pulse" />
          </>
        ) : error ? (
          <div className="card p-12 text-center">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="card p-12 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-fg-4" />
            <p className="mt-4 font-medium text-fg-1">No memory entries yet.</p>
            <p className="mt-1 text-sm text-fg-3 max-w-sm mx-auto">
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
            <Search className="mx-auto h-8 w-8 text-fg-4" />
            <p className="mt-3 text-sm text-fg-3">No entries found.</p>
          </div>
        ) : (
          filtered.map((entry) => {
            const catConfig = categoryConfig[entry.category] ?? categoryConfig.general;
            const isAutoGen = entry.autoGenerated;
            const isBeingDeleted = deletingId === entry.id;
            return (
              <div key={entry.id} className="card p-5 group">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                      <catConfig.icon className="h-4 w-4 text-brand-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-fg-1">
                          {entry.title}
                        </h3>
                        {isAutoGen && (
                          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">
                            AI Generated
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-fg-2 leading-relaxed">
                        {entry.content}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-fg-4">
                        <span>{catConfig.label}</span>
                        {entry.source && (
                          <span>From: {entry.source}</span>
                        )}
                        <span>Updated {formatUpdatedAt(entry.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                    {isAutoGen ? (
                      <>
                        <span title="This entry is system-generated">
                          <button
                            disabled
                            className="rounded-lg p-1.5 text-fg-4 cursor-not-allowed"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </span>
                        <span title="This entry is system-generated">
                          <button
                            disabled
                            className="rounded-lg p-1.5 text-fg-4 cursor-not-allowed"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </span>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => openEditForm(entry)}
                          className="rounded-lg p-1.5 text-fg-4 hover:bg-bg-3 hover:text-fg-2"
                          title="Edit entry"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm("Delete this memory entry?")) {
                              handleDeleteConfirm(entry.id);
                            }
                          }}
                          disabled={isBeingDeleted}
                          className="rounded-lg p-1.5 text-fg-4 hover:bg-red-950/40 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete entry"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
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
