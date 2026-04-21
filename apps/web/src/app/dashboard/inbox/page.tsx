"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Pencil,
  Filter,
  Zap,
  ChevronDown,
  ChevronUp,
  Users,
  Settings,
  Maximize2,
  X,
  Save,
  Play,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AGENT_COLORS, type AgentRoleSlug } from "@/lib/agent-colors";
import { ARCHETYPE_SLUGS } from "@/lib/archetypes";
import {
  getHeartbeatHistory,
  triggerHeartbeat,
  type HeartbeatResult,
  type ArchetypeSlug,
} from "@/app/dashboard/inbox/heartbeats";
import { HeartbeatUpdate } from "@/app/dashboard/inbox/components/HeartbeatUpdate";
import { ARCHETYPE_CONFIG } from "@/lib/archetype-config";
import type { InboxItem } from "@/app/api/inbox/pending/route";

type ApprovalStatus = "pending" | "approved" | "rejected";
type FilterTab = "all" | "pending" | "approved" | "rejected";
type InboxSection = "approvals" | "team-updates";

const urgencyColors = {
  low: "bg-slate-100 text-slate-600",
  normal: "bg-sky-50 text-sky-700",
  high: "bg-amber-50 text-amber-700",
  critical: "bg-red-50 text-red-700",
};

function formatCreatedAt(iso: string): string {
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
  return date.toLocaleDateString();
}

export default function InboxPage() {
  const router = useRouter();

  // Data state
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [filter, setFilter] = useState<FilterTab>("pending");
  const [previewExpandedId, setPreviewExpandedId] = useState<string | null>(null);
  const [expandedModalId, setExpandedModalId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>("");
  const [section, setSection] = useState<InboxSection>("approvals");

  // Heartbeat state
  const [heartbeats, setHeartbeats] = useState<HeartbeatResult[]>([]);
  const [heartbeatsLoading, setHeartbeatsLoading] = useState(false);
  // Per-archetype trigger state: tracks which archetypes are currently running a check-in
  const [triggeringArchetypes, setTriggeringArchetypes] = useState<Set<ArchetypeSlug>>(new Set());

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/inbox/pending", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load inbox");
        return res.json() as Promise<InboxItem[]>;
      })
      .then((data) => setItems(data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load inbox"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (section === "team-updates") {
      setHeartbeatsLoading(true);
      getHeartbeatHistory()
        .then((data) => setHeartbeats(data.filter((h) => h.status === "completed" && h.title)))
        .finally(() => setHeartbeatsLoading(false));
    }
  }, [section]);

  const updateStatus = (id: string, status: ApprovalStatus) => {
    const item = items.find((i) => i.id === id);
    // Optimistic local update first for snappy UI
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status } : i))
    );
    // Only persist to DB if this came from the approvals table
    if (item?.source === "approvals") {
      fetch(`/api/inbox/pending/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
        .then((res) => {
          if (!res.ok) {
            // Roll back optimistic update on failure
            setItems((prev) =>
              prev.map((i) => (i.id === id ? { ...i, status: item.status } : i))
            );
          }
        })
        .catch(() => {
          // Roll back on network error
          setItems((prev) =>
            prev.map((i) => (i.id === id ? { ...i, status: item.status } : i))
          );
        });
    }
  };

  const bulkApproveHighConfidence = () => {
    const toApprove = items.filter(
      (item) => item.status === "pending" && item.confidence >= 0.9
    );
    toApprove.forEach((item) => updateStatus(item.id, "approved"));
  };

  const openEdit = (item: InboxItem) => {
    // Check localStorage for saved edits
    const saved = localStorage.getItem(`edify_inbox_edits_${item.id}`);
    setEditContent(saved ?? item.preview);
    setEditingId(item.id);
    setExpandedModalId(null);
  };

  const saveEdit = (id: string) => {
    const item = items.find((i) => i.id === id);
    const captured = editContent;

    if (item?.source === "approvals") {
      // Persist to DB; update local state on success
      fetch(`/api/inbox/pending/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ output_preview: captured }),
      })
        .then((res) => {
          if (res.ok) {
            setItems((prev) =>
              prev.map((i) => (i.id === id ? { ...i, preview: captured } : i))
            );
          }
        })
        .catch(() => {/* ignore — user can retry */});
    } else {
      // messages fallback: localStorage only
      localStorage.setItem(`edify_inbox_edits_${id}`, captured);
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, preview: captured } : i))
      );
    }

    setEditingId(null);
    setEditContent("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const runCheckIn = async (archetype: ArchetypeSlug) => {
    if (triggeringArchetypes.has(archetype)) return; // already running
    setTriggeringArchetypes((prev) => new Set(prev).add(archetype));
    try {
      const result = await triggerHeartbeat(archetype);
      // Prepend the new result into the heartbeats list so it appears at top
      setHeartbeats((prev) => [result, ...prev]);
    } catch (err) {
      console.error("[inbox] runCheckIn failed:", err);
    } finally {
      setTriggeringArchetypes((prev) => {
        const next = new Set(prev);
        next.delete(archetype);
        return next;
      });
    }
  };

  const openExpand = (id: string) => {
    setExpandedModalId(id);
    setEditingId(null);
  };

  const closeExpand = () => setExpandedModalId(null);

  const filtered =
    filter === "all" ? items : items.filter((i) => i.status === filter);
  const pendingCount = items.filter((i) => i.status === "pending").length;
  const highConfidenceCount = items.filter(
    (i) => i.status === "pending" && i.confidence >= 0.9
  ).length;

  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: "pending", label: "Pending", count: pendingCount },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "all", label: "All" },
  ];

  // Item being shown in expand modal
  const expandedItem = expandedModalId
    ? items.find((i) => i.id === expandedModalId)
    : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-1">Inbox</h1>
          <p className="mt-1 text-slate-500">
            Approvals from your team and proactive updates.
          </p>
        </div>
        {section === "approvals" && highConfidenceCount > 0 && (
          <button
            onClick={bulkApproveHighConfidence}
            className="btn-secondary"
          >
            <Zap className="h-4 w-4 text-amber-500" />
            Auto-approve {highConfidenceCount} high-confidence
          </button>
        )}
        {section === "team-updates" && (
          <button
            onClick={async () => {
              const allSlugs = Object.keys(ARCHETYPE_CONFIG) as ArchetypeSlug[];
              await Promise.allSettled(allSlugs.map((slug) => runCheckIn(slug)));
            }}
            disabled={triggeringArchetypes.size > 0}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {triggeringArchetypes.size > 0 ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4 text-brand-500" />
            )}
            {triggeringArchetypes.size > 0
              ? `Running ${triggeringArchetypes.size} check-in${triggeringArchetypes.size > 1 ? "s" : ""}…`
              : "Run All Check-ins"}
          </button>
        )}
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
        <button
          onClick={() => setSection("approvals")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
            section === "approvals"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Approval Queue
          {pendingCount > 0 && (
            <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-xs text-white">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setSection("team-updates")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all flex items-center gap-1.5 ${
            section === "team-updates"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          Team Updates
        </button>
      </div>

      {/* ── Approvals section ── */}
      {section === "approvals" && (
        <>
          {/* Filter Tabs */}
          {!loading && !error && items.length > 0 && (
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                    filter === tab.key
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-xs text-white">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Approval Cards */}
          <div className="space-y-3">
            {loading ? (
              <>
                <div className="h-40 rounded-xl bg-slate-100 animate-pulse" />
                <div className="h-40 rounded-xl bg-slate-100 animate-pulse" />
              </>
            ) : error ? (
              <div className="card p-12 text-center">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            ) : items.length === 0 ? (
              <div className="card p-12 text-center">
                <Filter className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-4 font-medium text-slate-700">
                  Nothing waiting for your review right now.
                </p>
                <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
                  Your team will flag items here when they draft emails, posts, or proposals.
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="card p-12 text-center">
                <Filter className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm text-slate-500">
                  No items match this filter.
                </p>
              </div>
            ) : (
              filtered.map((item) => {
                const agentConfig = AGENT_COLORS[item.agent as AgentRoleSlug] ?? AGENT_COLORS.executive_assistant;
                const isPreviewExpanded = previewExpandedId === item.id;
                const isEditing = editingId === item.id;
                const confidenceColor =
                  item.confidence >= 0.85
                    ? "bg-emerald-500"
                    : item.confidence >= 0.6
                    ? "bg-amber-500"
                    : "bg-red-500";

                return (
                  <div
                    key={item.id}
                    className={`card border-l-4 ${agentConfig.border} overflow-hidden`}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${agentConfig.bg}`}
                          >
                            <agentConfig.icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-slate-900">
                              {item.title}
                            </h3>
                            <p className="mt-0.5 text-sm text-slate-500">
                              {item.summary}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2 ml-4">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              urgencyColors[item.urgency]
                            }`}
                          >
                            {item.urgency}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatCreatedAt(item.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Confidence Bar */}
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex-1">
                          <div className="h-1.5 rounded-full bg-slate-100">
                            <div
                              className={`h-1.5 rounded-full ${confidenceColor} transition-all duration-500`}
                              style={{ width: `${item.confidence * 100}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs font-medium text-slate-500">
                          {Math.round(item.confidence * 100)}% confidence
                        </span>
                        <button
                          onClick={() =>
                            setPreviewExpandedId(isPreviewExpanded ? null : item.id)
                          }
                          className="text-slate-400 hover:text-slate-600"
                          title="Toggle preview"
                        >
                          {isPreviewExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      {/* Inline Preview (collapsed snippet) */}
                      {isPreviewExpanded && !isEditing && (
                        <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
                          {item.preview}
                        </div>
                      )}

                      {/* Edit Mode */}
                      {isEditing && (
                        <div className="mt-4 space-y-2">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="input-field font-mono text-sm w-full"
                            rows={10}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(item.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
                            >
                              <Save className="h-3.5 w-3.5" />
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="btn-ghost text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      {item.status === "pending" && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            onClick={() => updateStatus(item.id, "approved")}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 transition-colors"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => updateStatus(item.id, "rejected")}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </button>
                          <button
                            onClick={() => openExpand(item.id)}
                            className="btn-ghost"
                            title="View full content"
                          >
                            <Maximize2 className="h-4 w-4" />
                            Expand
                          </button>
                          <button
                            onClick={() => openEdit(item)}
                            className="btn-ghost"
                            title="Edit content"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>
                        </div>
                      )}

                      {item.status !== "pending" && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                              item.status === "approved"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {item.status === "approved" ? (
                              <CheckCircle className="h-3.5 w-3.5" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5" />
                            )}
                            {item.status === "approved" ? "Approved" : "Rejected"}
                          </span>
                          <button
                            onClick={() => openExpand(item.id)}
                            className="btn-ghost text-xs"
                          >
                            <Maximize2 className="h-3.5 w-3.5" />
                            Expand
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* ── Team Updates section ── */}
      {section === "team-updates" && (
        <div className="space-y-3">
          {/* Per-archetype "Run Check-in Now" row */}
          <div className="flex flex-wrap gap-2">
            {(Object.keys(ARCHETYPE_CONFIG) as ArchetypeSlug[]).map((slug) => {
              const meta = ARCHETYPE_CONFIG[slug];
              const isRunning = triggeringArchetypes.has(slug);
              return (
                <button
                  key={slug}
                  onClick={() => runCheckIn(slug)}
                  disabled={isRunning}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${meta.light} ${meta.text} border-current hover:opacity-80`}
                  title={`Run ${meta.label} check-in now`}
                >
                  {isRunning ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                  {meta.label}
                </button>
              );
            })}
          </div>

          {heartbeatsLoading ? (
            <>
              <div className="h-36 bg-slate-100 rounded-xl animate-pulse" />
              <div className="h-36 bg-slate-100 rounded-xl animate-pulse" />
              <div className="h-36 bg-slate-100 rounded-xl animate-pulse" />
            </>
          ) : heartbeats.length === 0 ? (
            <div className="card p-12 text-center">
              <Users className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 font-medium text-slate-700">
                Your team hasn&apos;t checked in yet.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Run a check-in above or configure scheduled check-ins in Settings.
              </p>
              <Link
                href="/dashboard/settings/heartbeats"
                className="btn-secondary mt-4 inline-flex items-center gap-1.5"
              >
                <Settings className="h-4 w-4" />
                Configure Check-ins
              </Link>
            </div>
          ) : (
            heartbeats.map((result) => (
              <HeartbeatUpdate
                key={result.id}
                result={result}
                onDiscuss={(archetype) => {
                  if ((ARCHETYPE_SLUGS as readonly string[]).includes(archetype)) {
                    router.push(`/dashboard/team/${archetype}`);
                  }
                }}
              />
            ))
          )}
        </div>
      )}

      {/* ── Full-content expand modal ── */}
      {expandedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeExpand}
        >
          <div
            className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl bg-white shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-semibold text-slate-900 text-lg">
                  {expandedItem.title}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">{expandedItem.summary}</p>
              </div>
              <button
                onClick={closeExpand}
                className="ml-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
              {expandedItem.preview || "No content available."}
            </div>
            <div className="mt-4 flex gap-2">
              {expandedItem.status === "pending" && (
                <>
                  <button
                    onClick={() => { updateStatus(expandedItem.id, "approved"); closeExpand(); }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => { updateStatus(expandedItem.id, "rejected"); closeExpand(); }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                  <button
                    onClick={() => { closeExpand(); openEdit(expandedItem); }}
                    className="btn-ghost"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                </>
              )}
              <button onClick={closeExpand} className="btn-ghost ml-auto">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
