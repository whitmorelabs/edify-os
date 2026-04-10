"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Search, Filter } from "lucide-react";
import { AGENT_COLORS, type AgentRoleSlug } from "@/lib/agent-colors";

type TaskStatus =
  | "pending"
  | "planning"
  | "executing"
  | "awaiting_approval"
  | "completed"
  | "failed";

interface TaskStep {
  id: string;
  stepNumber: number;
  agentRole: string;
  action: string;
  durationMs: number | null;
}

interface Task {
  id: string;
  title: string;
  agent: AgentRoleSlug;
  status: TaskStatus;
  confidence: number | null;
  createdAt: string;
  steps: TaskStep[];
}

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

const tasks: Task[] = [
  {
    id: "1",
    title: "Research Spring 2026 grant opportunities",
    agent: "development_director",
    status: "completed",
    confidence: 0.91,
    createdAt: "Today, 9:00 AM",
    steps: [
      { id: "s1", stepNumber: 1, agentRole: "grant_research", action: "Searched foundation databases for matching grants", durationMs: 4200 },
      { id: "s2", stepNumber: 2, agentRole: "grant_research", action: "Filtered 47 results by mission alignment", durationMs: 2100 },
      { id: "s3", stepNumber: 3, agentRole: "reporting", action: "Compiled top 5 opportunities with analysis", durationMs: 3400 },
    ],
  },
  {
    id: "2",
    title: "Draft April newsletter for subscribers",
    agent: "marketing_director",
    status: "awaiting_approval",
    confidence: 0.87,
    createdAt: "Today, 8:30 AM",
    steps: [
      { id: "s4", stepNumber: 1, agentRole: "content_writing", action: "Drafted newsletter content (1,200 words)", durationMs: 8500 },
      { id: "s5", stepNumber: 2, agentRole: "email_campaign", action: "Formatted for Mailchimp template", durationMs: 2200 },
    ],
  },
  {
    id: "3",
    title: "Prepare board meeting agenda for Thursday",
    agent: "executive_assistant",
    status: "completed",
    confidence: 0.94,
    createdAt: "Yesterday, 4:00 PM",
    steps: [
      { id: "s6", stepNumber: 1, agentRole: "meeting_prep", action: "Pulled action items from last meeting", durationMs: 1800 },
      { id: "s7", stepNumber: 2, agentRole: "meeting_prep", action: "Compiled financial summary", durationMs: 3100 },
      { id: "s8", stepNumber: 3, agentRole: "meeting_prep", action: "Created agenda document", durationMs: 2900 },
    ],
  },
  {
    id: "4",
    title: "Send thank-you emails to gala donors",
    agent: "development_director",
    status: "executing",
    confidence: null,
    createdAt: "Today, 10:15 AM",
    steps: [
      { id: "s9", stepNumber: 1, agentRole: "donor_outreach", action: "Identifying donors from event attendance list", durationMs: null },
    ],
  },
  {
    id: "5",
    title: "Create social media content for volunteer week",
    agent: "marketing_director",
    status: "planning",
    confidence: null,
    createdAt: "Today, 10:30 AM",
    steps: [],
  },
];

export default function TasksPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

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
            {filtered.map((task) => {
              const agentConfig = AGENT_COLORS[task.agent];
              const sc = statusConfig[task.status];
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
                <tbody key={task.id}>
                  <tr
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
                      {task.createdAt}
                    </td>
                  </tr>

                  {/* Expanded Steps */}
                  {isExpanded && task.steps.length > 0 && (
                    <tr>
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
                                  {step.durationMs &&
                                    ` · ${(step.durationMs / 1000).toFixed(1)}s`}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <Filter className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">
              No tasks match your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
