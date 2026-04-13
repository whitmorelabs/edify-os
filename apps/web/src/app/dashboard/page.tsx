"use client";

import {
  CheckCircle,
  Clock,
  Users,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  MessageSquarePlus,
  Inbox,
  ListChecks,
  Sparkles,
} from "lucide-react";
import { AGENT_COLORS, type AgentRoleSlug } from "@/lib/agent-colors";
import { useChatPanel } from "@/components/chat-provider";

const stats = [
  {
    icon: CheckCircle,
    label: "Tasks Completed",
    value: "24",
    trend: { value: 12, positive: true },
  },
  {
    icon: Clock,
    label: "Pending Approvals",
    value: "7",
    trend: { value: 3, positive: false },
  },
  {
    icon: Users,
    label: "Active Agents",
    value: "3",
    trend: null,
  },
  {
    icon: Target,
    label: "Avg Confidence",
    value: "87%",
    trend: { value: 5, positive: true },
  },
];

const activities = [
  {
    id: "1",
    agent: "development_director" as AgentRoleSlug,
    action: "Drafted donor outreach email for Spring campaign",
    time: "2 min ago",
    status: "completed",
  },
  {
    id: "2",
    agent: "marketing_director" as AgentRoleSlug,
    action: "Generated social media calendar for April",
    time: "15 min ago",
    status: "awaiting_approval",
  },
  {
    id: "3",
    agent: "executive_assistant" as AgentRoleSlug,
    action: "Scheduled board meeting for next Thursday",
    time: "1 hr ago",
    status: "completed",
  },
  {
    id: "4",
    agent: "development_director" as AgentRoleSlug,
    action: "Created grant proposal draft for Ford Foundation",
    time: "3 hr ago",
    status: "awaiting_approval",
  },
  {
    id: "5",
    agent: "marketing_director" as AgentRoleSlug,
    action: "Published weekly newsletter to 2,400 subscribers",
    time: "5 hr ago",
    status: "completed",
  },
];

const quickActions = [
  {
    icon: MessageSquarePlus,
    title: "Ask a Question",
    description: "Chat with your AI team",
    action: "chat" as const,
  },
  {
    icon: Inbox,
    title: "View Approvals",
    description: "7 items need your review",
    href: "/dashboard/inbox",
  },
  {
    icon: ListChecks,
    title: "Check Tasks",
    description: "24 tasks this week",
    href: "/dashboard/tasks",
  },
];

export default function DashboardHome() {
  const { openChat } = useChatPanel();

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
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#8B5CF6]/10">
                <stat.icon className="h-5 w-5 text-[#8B5CF6]" />
              </div>
              <span className="text-sm text-gray-500">{stat.label}</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">
                {stat.value}
              </span>
              {stat.trend && (
                <span
                  className={`inline-flex items-center text-xs font-medium ${
                    stat.trend.positive
                      ? "text-emerald-600"
                      : "text-red-500"
                  }`}
                >
                  {stat.trend.positive ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {stat.trend.value}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {quickActions.map((action) =>
          "action" in action && action.action === "chat" ? (
            <button
              key={action.title}
              onClick={() => openChat("executive_assistant")}
              className="card-interactive p-5 text-left"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#8B5CF6]/10">
                <action.icon className="h-5 w-5 text-[#8B5CF6]" />
              </div>
              <h3 className="mt-3 font-semibold text-gray-900">
                {action.title}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {action.description}
              </p>
            </button>
          ) : (
            <a
              key={action.title}
              href={"href" in action ? action.href : "#"}
              className="card-interactive p-5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#8B5CF6]/10">
                <action.icon className="h-5 w-5 text-[#8B5CF6]" />
              </div>
              <h3 className="mt-3 font-semibold text-gray-900">
                {action.title}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {action.description}
              </p>
            </a>
          )
        )}
      </div>

      {/* Activity Feed */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="heading-2">Recent Activity</h2>
          <a
            href="/dashboard/tasks"
            className="text-sm font-medium text-[#8B5CF6] hover:text-[#7C3AED]"
          >
            View all
          </a>
        </div>
        <div className="space-y-3">
          {activities.map((item) => {
            const agentConfig = AGENT_COLORS[item.agent];
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
                      <span className={`text-sm font-medium ${agentConfig.text}`}>
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
                    <span className="text-xs text-gray-400">{item.time}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
