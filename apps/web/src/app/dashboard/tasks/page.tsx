"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  MessageSquare,
  Maximize2,
  Trash2,
  FileText,
  Mail,
  Share2,
  Landmark,
  X,
} from "lucide-react";
import Link from "next/link";
import { AGENT_COLORS, type AgentRoleSlug } from "@/lib/agent-colors";
import type { TaskRow, TaskStatus } from "@/app/api/tasks/recent/route";

const statusConfig: Record<
  TaskStatus,
  { label: string; bg: string; text: string }
> = {
  pending: { label: "Pending", bg: "bg-slate-100", text: "text-slate-600" },
  planning: { label: "Planning", bg: "bg-brand-50", text: "text-brand-700" },
  executing: { label: "Executing", bg: "bg-amber-50", text: "text-amber-700" },
  awaiting_approval: {
    label: "Awaiting Approval",
    bg: "bg-sky-50",
    text: "text-sky-700",
  },
  completed: {
    label: "Completed",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  failed: { label: "Failed", bg: "bg-red-50", text: "text-red-700" },
};

// Kind -> { label, icon, color } for the small pill on each task card.
const kindConfig: Record<
  string,
  { label: string; icon: typeof FileText; bg: string; text: string }
> = {
  chat_reply: { label: "Chat reply", icon: MessageSquare, bg: "bg-slate-100", text: "text-slate-600" },
  email_draft: { label: "Email draft", icon: Mail, bg: "bg-sky-50", text: "text-sky-700" },
  social_post: { label: "Social post", icon: Share2, bg: "bg-amber-50", text: "text-amber-700" },
  grant_note: { label: "Grant note", icon: Landmark, bg: "bg-emerald-50", text: "text-emerald-700" },
  document: { label: "Document", icon: FileText, bg: "bg-violet-50", text: "text-violet-700" },
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
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
}

export default function TasksPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/tasks/recent", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load tasks");
        return res.json() as Promise<TaskRow[]>;
      })
      .then((data) => setTasks(data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load tasks"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tasks.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const openTask = openTaskId ? tasks.find((t) => t.id === openTaskId) : null;

  const deleteTask = async (id: string) => {
    if (!window.confirm("Delete this task? This cannot be undone.")) return;
    // Optimistic remove
    const prev = tasks;
    setTasks((curr) => curr.filter((t) => t.id !== id));
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
    } catch {
      // Roll back on failure
      setTasks(prev);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="heading-1">Tasks</h1>
        <p className="mt-1 text-slate-500">
          Completed work from your AI team — drafts, replies, and artifacts.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field w-auto"
        >
          <option value="all">All Statuses</option>
          {Object.entries(statusConfig).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Task cards */}
      {loading ? (
        <div className="space-y-3">
          <div className="h-28 rounded-xl bg-slate-100 animate-pulse" />
          <div className="h-28 rounded-xl bg-slate-100 animate-pulse" />
          <div className="h-28 rounded-xl bg-slate-100 animate-pulse" />
        </div>
      ) : error ? (
        <div className="card p-12 text-center">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="card p-12 text-center">
          <MessageSquare className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-4 font-medium text-slate-700">No completed work yet.</p>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            Ask your team to get started — drafts, replies, and artifacts will show up here.
          </p>
          <Link
            href="/dashboard/team"
            className="btn-secondary mt-4 inline-flex items-center gap-1.5"
          >
            Go to Team
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Filter className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">No tasks match your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => {
            const agentConfig = AGENT_COLORS[task.agent as AgentRoleSlug] ?? AGENT_COLORS.executive_assistant;
            const sc = statusConfig[task.status] ?? statusConfig.pending;
            const kc = task.kind ? kindConfig[task.kind] : null;
            const KindIcon = kc?.icon;

            return (
              <div
                key={task.id}
                className={`card border-l-4 ${agentConfig.border} overflow-hidden`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${agentConfig.bg}`}
                      >
                        <agentConfig.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900 truncate">
                          {task.title}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="text-xs text-slate-500">{agentConfig.label}</span>
                          {kc && KindIcon && (
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${kc.bg} ${kc.text}`}
                            >
                              <KindIcon className="h-3 w-3" />
                              {kc.label}
                            </span>
                          )}
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${sc.bg} ${sc.text}`}
                          >
                            {sc.label}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatCreatedAt(task.createdAt)}
                          </span>
                        </div>
                        {task.preview && (
                          <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                            {task.preview}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => setOpenTaskId(task.id)}
                        className="btn-ghost text-xs"
                        title="Open full content"
                      >
                        <Maximize2 className="h-4 w-4" />
                        Open
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="btn-ghost text-xs text-slate-500 hover:text-red-600"
                        title="Delete task"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Open-task modal */}
      {openTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpenTaskId(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl bg-white shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-semibold text-slate-900 text-lg">{openTask.title}</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {(AGENT_COLORS[openTask.agent as AgentRoleSlug] ?? AGENT_COLORS.executive_assistant).label}
                  {openTask.kind ? ` · ${kindConfig[openTask.kind]?.label ?? openTask.kind}` : ""}
                  {" · "}
                  {formatCreatedAt(openTask.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setOpenTaskId(null)}
                className="ml-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
              {openTask.preview || "No preview available for this task."}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  deleteTask(openTask.id);
                  setOpenTaskId(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
              <button onClick={() => setOpenTaskId(null)} className="btn-ghost ml-auto">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
