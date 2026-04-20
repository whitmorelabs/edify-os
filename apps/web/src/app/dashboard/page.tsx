"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle,
  Clock,
  Users,
  MessageSquarePlus,
  Inbox,
  ListChecks,
  Sparkles,
} from "lucide-react";
import { AGENT_COLORS, type AgentRoleSlug } from "@/lib/agent-colors";
import type { DashboardSummary } from "@/app/api/dashboard/summary/route";

const quickActions = [
  {
    icon: MessageSquarePlus,
    title: "Ask a Question",
    description: "Chat with your AI team",
    href: "/dashboard/team/executive_assistant",
  },
  {
    icon: Inbox,
    title: "View Approvals",
    description: "Review pending items",
    href: "/dashboard/inbox",
  },
  {
    icon: ListChecks,
    title: "Check Tasks",
    description: "View this week's tasks",
    href: "/dashboard/tasks",
  },
];

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="card p-5 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gray-200" />
            <div className="h-4 w-24 rounded bg-gray-200" />
          </div>
          <div className="mt-3 h-8 w-12 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="card p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-gray-200" />
              <div className="h-3 w-64 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function DashboardHome() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/summary")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: DashboardSummary | null) => {
        setSummary(data);
      })
      .catch(() => {
        setSummary(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    {
      icon: CheckCircle,
      label: "Tasks Completed",
      value: summary?.stats.tasksCompleted ?? 0,
    },
    {
      icon: Clock,
      label: "Pending Approvals",
      value: summary?.stats.pendingApprovals ?? 0,
    },
    {
      icon: Users,
      label: "Active Agents",
      value: summary?.stats.activeAgents ?? 0,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div>
        <h1 className="heading-1 flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-[#8B5CF6]" />
          Good morning
        </h1>
        <p className="mt-1 text-gray-500">
          Here&apos;s what your AI team has been working on.
        </p>
      </div>

      {/* Stats Row */}
      {loading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#8B5CF6]/10">
                  <stat.icon className="h-5 w-5 text-[#8B5CF6]" />
                </div>
                <span className="text-sm text-gray-500">{stat.label}</span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {quickActions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="card-interactive p-5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#8B5CF6]/10">
              <action.icon className="h-5 w-5 text-[#8B5CF6]" />
            </div>
            <h3 className="mt-3 font-semibold text-gray-900">{action.title}</h3>
            <p className="mt-1 text-sm text-gray-500">{action.description}</p>
          </Link>
        ))}
      </div>

      {/* Activity Feed */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="heading-2">Recent Activity</h2>
          <Link
            href="/dashboard/tasks"
            className="text-sm font-medium text-[#8B5CF6] hover:text-[#7C3AED]"
          >
            View all
          </Link>
        </div>

        {loading ? (
          <ActivitySkeleton />
        ) : !summary || summary.recentActivity.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-sm text-gray-500">
              Your team hasn&apos;t done anything yet.{" "}
              <Link
                href="/dashboard/team"
                className="font-medium text-[#8B5CF6] hover:text-[#7C3AED]"
              >
                Start a conversation to kick things off.
              </Link>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {summary.recentActivity.map((item) => {
              const agentConfig = AGENT_COLORS[item.agent as AgentRoleSlug];
              if (!agentConfig) return null;
              return (
                <div
                  key={item.id}
                  className={`card border-l-4 p-4 ${agentConfig.border}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${agentConfig.light}`}
                      >
                        <agentConfig.icon
                          className={`h-4 w-4 ${agentConfig.text}`}
                        />
                      </div>
                      <div>
                        <span
                          className={`text-sm font-medium ${agentConfig.text}`}
                        >
                          {agentConfig.label}
                        </span>
                        <p className="text-sm text-gray-600">{item.action}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.status === "awaiting_approval" && (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                          Needs Approval
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {formatRelativeTime(item.time)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
