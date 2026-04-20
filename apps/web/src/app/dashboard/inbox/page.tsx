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
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AGENT_COLORS, type AgentRoleSlug } from "@/lib/agent-colors";
import { ARCHETYPE_SLUGS } from "@/lib/archetypes";
import { getHeartbeatHistory, type HeartbeatResult } from "@/app/dashboard/inbox/heartbeats";
import { HeartbeatUpdate } from "@/app/dashboard/inbox/components/HeartbeatUpdate";

type ApprovalStatus = "pending" | "approved" | "rejected";

interface ApprovalItem {
  id: string;
  agent: AgentRoleSlug;
  title: string;
  summary: string;
  preview: string;
  confidence: number;
  urgency: "low" | "normal" | "high" | "critical";
  status: ApprovalStatus;
  createdAt: string;
}

const initialItems: ApprovalItem[] = [
  {
    id: "1",
    agent: "development_director",
    title: "Send donor email blast",
    summary:
      "Spring fundraising campaign email to 1,200 contacts with personalized greetings.",
    preview:
      "Dear [Donor Name],\n\nAs spring arrives, we're reminded of the incredible impact your generosity has made...",
    confidence: 0.92,
    urgency: "high",
    status: "pending",
    createdAt: "10 min ago",
  },
  {
    id: "2",
    agent: "marketing_director",
    title: "Publish blog post",
    summary:
      'Annual Impact Report 2025 blog post — 1,200 words with infographics.',
    preview:
      "2025 was a transformative year for Hope Community Foundation. Together with our partners...",
    confidence: 0.87,
    urgency: "normal",
    status: "pending",
    createdAt: "45 min ago",
  },
  {
    id: "3",
    agent: "executive_assistant",
    title: "Book venue for May gala",
    summary:
      "Reserve community center for annual gala on May 15th. $2,500 deposit required.",
    preview:
      "Venue: Downtown Community Center\nDate: May 15, 2026\nCapacity: 250 guests\nDeposit: $2,500",
    confidence: 0.78,
    urgency: "high",
    status: "pending",
    createdAt: "2 hrs ago",
  },
  {
    id: "4",
    agent: "development_director",
    title: "Submit LOI to Ford Foundation",
    summary:
      "Letter of Intent for the Youth Development grant program. $150K request.",
    preview:
      "Dear Program Officer,\n\nHope Community Foundation respectfully submits this Letter of Intent...",
    confidence: 0.83,
    urgency: "critical",
    status: "pending",
    createdAt: "3 hrs ago",
  },
  {
    id: "5",
    agent: "marketing_director",
    title: "Schedule social media posts",
    summary: "5 posts for next week across Facebook and Instagram.",
    preview:
      "Monday: Community garden photo update\nTuesday: Volunteer spotlight\nWednesday: Event reminder...",
    confidence: 0.95,
    urgency: "low",
    status: "pending",
    createdAt: "5 hrs ago",
  },
];

const urgencyColors = {
  low: "bg-slate-100 text-slate-600",
  normal: "bg-sky-50 text-sky-700",
  high: "bg-amber-50 text-amber-700",
  critical: "bg-red-50 text-red-700",
};

type FilterTab = "all" | "pending" | "approved" | "rejected";
type InboxSection = "approvals" | "team-updates";

export default function InboxPage() {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<FilterTab>("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [section, setSection] = useState<InboxSection>("approvals");
  const [heartbeats, setHeartbeats] = useState<HeartbeatResult[]>([]);
  const [heartbeatsLoading, setHeartbeatsLoading] = useState(false);

  useEffect(() => {
    if (section === "team-updates") {
      setHeartbeatsLoading(true);
      getHeartbeatHistory()
        .then((data) => setHeartbeats(data.filter((h) => h.status === "completed" && h.title)))
        .finally(() => setHeartbeatsLoading(false));
    }
  }, [section]);

  const updateStatus = (id: string, status: ApprovalStatus) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  const bulkApproveHighConfidence = () => {
    setItems((prev) =>
      prev.map((item) =>
        item.status === "pending" && item.confidence >= 0.9
          ? { ...item, status: "approved" as ApprovalStatus }
          : item
      )
    );
  };

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

          {/* Approval Cards */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="card p-12 text-center">
                <Filter className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm text-slate-500">
                  No items match this filter.
                </p>
              </div>
            ) : (
              filtered.map((item) => {
                const agentConfig = AGENT_COLORS[item.agent];
                const isExpanded = expandedId === item.id;
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
                            {item.createdAt}
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
                            setExpandedId(isExpanded ? null : item.id)
                          }
                          className="text-slate-400 hover:text-slate-600"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      {/* Expanded Preview */}
                      {isExpanded && (
                        <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600 whitespace-pre-wrap font-mono">
                          {item.preview}
                        </div>
                      )}

                      {/* Actions */}
                      {item.status === "pending" && (
                        <div className="mt-4 flex gap-2">
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
                          <button className="btn-ghost">
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>
                        </div>
                      )}

                      {item.status !== "pending" && (
                        <div className="mt-3">
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
                Configure proactive check-ins in Settings to get regular updates from your team.
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
    </div>
  );
}
