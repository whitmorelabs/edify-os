"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Search, Filter, MessageSquare } from "lucide-react";
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="heading-1">Tasks</h1>
        <p className="mt-1 text-slate-500">
          Track all work being done by your AI team.
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

      {/* Task Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            <div className="h-12 rounded-lg bg-slate-100 animate-pulse" />
            <div className="h-12 rounded-lg bg-slate-100 animate-pulse" />
            <div className="h-12 rounded-lg bg-slate-100 animate-pulse" />
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-4 font-medium text-slate-700">No tasks yet.</p>
            <p className="mt-1 text-sm text-slate-500">
              Start a conversation with any team member to begin.
            </p>
            <Link
              href="/dashboard/team"
              className="btn-secondary mt-4 inline-flex items-center gap-1.5"
            >
              Go to Team
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  Task
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  Agent
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  Confidence
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <Filter className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-3 text-sm text-slate-500">
                      No tasks match your filters.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((task) => {
                  const agentConfig = AGENT_COLORS[task.agent as AgentRoleSlug] ?? AGENT_COLORS.executive_assistant;
                  const sc = statusConfig[task.status] ?? statusConfig.pending;
                  const isExpanded = expandedId === task.id;
                  const confidenceColor =
                    task.confidence === null
                      ? "bg-slate-200"
                      : task.confidence >= 0.85
                      ? "bg-emerald-500"
                      : task.confidence >= 0.6
                      ? "bg-amber-500"
                      : "bg-red-500";

                  return (
                    <>
                      <tr
                        key={`row-${task.id}`}
                        className="cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : task.id)
                        }
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-slate-400" />
                            )}
                            <span className="text-sm font-medium text-slate-900">
                              {task.title}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-2 w-2 rounded-full ${agentConfig.bg}`}
                            />
                            <span className="text-sm text-slate-600">
                              {agentConfig.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.bg} ${sc.text}`}
                          >
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {task.confidence !== null ? (
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 rounded-full bg-slate-100">
                                <div
                                  className={`h-1.5 rounded-full ${confidenceColor}`}
                                  style={{
                                    width: `${task.confidence * 100}%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs text-slate-500">
                                {Math.round(task.confidence * 100)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">--</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-500">
                          {formatCreatedAt(task.createdAt)}
                        </td>
                      </tr>

                      {/* Expanded Steps */}
                      {isExpanded && task.steps.length > 0 && (
                        <tr key={`steps-${task.id}`}>
                          <td colSpan={5} className="bg-slate-50 px-5 py-4">
                            <div className="ml-6 space-y-3 border-l-2 border-brand-200 pl-4">
                              {task.steps.map((step) => (
                                <div
                                  key={step.id}
                                  className="relative flex items-start gap-3"
                                >
                                  <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-brand-400 ring-2 ring-white" />
                                  <div>
                                    <p className="text-sm text-slate-700">
                                      {step.action}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                      Step {step.stepNumber}
                                      {step.durationMs != null &&
                                        ` · ${(step.durationMs / 1000).toFixed(1)}s`}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
