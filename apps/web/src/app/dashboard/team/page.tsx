"use client";

import { MessageSquare, BarChart3, Clock, CheckCircle } from "lucide-react";
import {
  AGENT_COLORS,
  AGENT_SLUGS,
  type AgentRoleSlug,
} from "@/lib/agent-colors";
import { useChatPanel } from "@/components/chat-provider";

const agentStats: Record<
  AgentRoleSlug,
  { tasksCompleted: number; avgConfidence: number; lastActive: string }
> = {
  development_director: {
    tasksCompleted: 12,
    avgConfidence: 0.91,
    lastActive: "2 min ago",
  },
  marketing_director: {
    tasksCompleted: 8,
    avgConfidence: 0.85,
    lastActive: "15 min ago",
  },
  executive_assistant: {
    tasksCompleted: 18,
    avgConfidence: 0.88,
    lastActive: "Just now",
  },
};

export default function TeamPage() {
  const { openChat } = useChatPanel();

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="heading-1">Your AI Team</h1>
        <p className="mt-1 text-slate-500">
          Meet the AI leaders powering your organization.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {AGENT_SLUGS.map((slug) => {
          const config = AGENT_COLORS[slug];
          const stats = agentStats[slug];
          const IconComponent = config.icon;

          return (
            <div
              key={slug}
              className={`card overflow-hidden border-t-4 ${config.border}`}
            >
              {/* Agent Header */}
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${config.bg}`}
                  >
                    <IconComponent className="h-7 w-7 text-white" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  {config.label}
                </h3>
                <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                  {config.description}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 border-t border-slate-100">
                <div className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-400">
                    <CheckCircle className="h-3.5 w-3.5" />
                  </div>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {stats.tasksCompleted}
                  </p>
                  <p className="text-xs text-slate-400">Tasks</p>
                </div>
                <div className="border-x border-slate-100 p-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-400">
                    <BarChart3 className="h-3.5 w-3.5" />
                  </div>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {Math.round(stats.avgConfidence * 100)}%
                  </p>
                  <p className="text-xs text-slate-400">Confidence</p>
                </div>
                <div className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {stats.lastActive}
                  </p>
                  <p className="text-xs text-slate-400">Last Active</p>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-slate-100 p-4">
                <button
                  onClick={() => openChat(slug)}
                  className="btn-primary w-full"
                >
                  <MessageSquare className="h-4 w-4" />
                  Start Conversation
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
