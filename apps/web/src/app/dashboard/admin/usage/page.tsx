"use client";

import { useEffect, useState } from "react";
import {
  MessageSquare,
  MessageCircle,
  CheckSquare,
  Bell,
  FileText,
  Cpu,
} from "lucide-react";
import { StatCard } from "./components/StatCard";
import { UsageChart } from "./components/UsageChart";
import type { TokenUsageSummary } from "@/app/api/admin/usage/tokens/route";

type Period = 7 | 30 | 90;

interface UsageData {
  period: string;
  summary: {
    totalConversations: number;
    totalMessages: number;
    tasksCreated: number;
    heartbeatsDelivered: number;
    documentsUploaded: number;
  };
  byArchetype: {
    slug: string;
    label: string;
    conversations: number;
    messages: number;
    tasks: number;
    color: string;
  }[];
  hourlyDistribution: { hour: number; label: string; value: number }[];
}

const periods: { value: Period; label: string }[] = [
  { value: 7, label: "Last 7 days" },
  { value: 30, label: "Last 30 days" },
  { value: 90, label: "Last 90 days" },
];

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

export default function UsagePage() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(7);
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenData, setTokenData] = useState<TokenUsageSummary | null>(null);
  const [archetypeMetric, setArchetypeMetric] = useState<"conversations" | "messages" | "tasks">(
    "conversations"
  );

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/admin/usage?days=${selectedPeriod}`).then((r) => r.json()),
      fetch(`/api/admin/usage/tokens?days=${selectedPeriod}`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([d, t]: [UsageData, TokenUsageSummary | null]) => {
        setData(d);
        setTokenData(t);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedPeriod]);

  // Comparison to previous period (mock: ~15% change baseline)
  const changeMap: Record<string, number> = {
    totalConversations: 12,
    totalMessages: 8,
    tasksCreated: -3,
    heartbeatsDelivered: 5,
    documentsUploaded: 22,
  };

  return (
    <div className="space-y-8">
      {/* Header + period selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="heading-1">Usage</h1>
          <p className="text-sm text-fg-3 mt-0.5">
            How your organization is using Edify OS.
          </p>
        </div>

        {/* Period toggle */}
        <div className="flex rounded-xl border border-bg-3 bg-bg-3 p-1 gap-1 self-start">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setSelectedPeriod(p.value)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
                selectedPeriod === p.value
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-fg-2 hover:text-fg-1"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading || !data ? (
        <div className="py-24 text-center text-fg-3 text-sm">Loading usage data...</div>
      ) : (
        <>
          {/* Summary stat cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard
              title="Conversations"
              value={data.summary.totalConversations}
              change={changeMap.totalConversations}
              icon={MessageSquare}
              iconBg="bg-brand-100"
              iconColor="text-brand-600"
            />
            <StatCard
              title="Messages sent"
              value={data.summary.totalMessages}
              change={changeMap.totalMessages}
              icon={MessageCircle}
              iconBg="bg-sky-100"
              iconColor="text-sky-600"
            />
            <StatCard
              title="Tasks created"
              value={data.summary.tasksCreated}
              change={changeMap.tasksCreated}
              icon={CheckSquare}
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
            />
            <StatCard
              title="Check-ins delivered"
              value={data.summary.heartbeatsDelivered}
              change={changeMap.heartbeatsDelivered}
              icon={Bell}
              iconBg="bg-amber-100"
              iconColor="text-amber-600"
            />
            <StatCard
              title="Documents uploaded"
              value={data.summary.documentsUploaded}
              change={changeMap.documentsUploaded}
              icon={FileText}
              iconBg="bg-violet-100"
              iconColor="text-violet-600"
            />
          </div>

          {/* Archetype breakdown */}
          <div className="card p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h2 className="heading-2">Your AI Team</h2>
                <p className="text-sm text-fg-3 mt-0.5">Which team members are used most.</p>
              </div>

              {/* Metric toggle */}
              <div className="flex rounded-xl border border-bg-3 bg-bg-3 p-1 gap-1 self-start">
                {(["conversations", "messages", "tasks"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setArchetypeMetric(m)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                      archetypeMetric === m
                        ? "bg-bg-2 text-fg-1 shadow-elev-1"
                        : "text-fg-2 hover:text-fg-1"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <UsageChart
              data={data.byArchetype.map((a) => ({
                label: a.label.replace("Director of ", "").replace(" Director", "").replace(" Coordinator", ""),
                value: a[archetypeMetric],
                color: a.color,
              }))}
            />

            {/* Table breakdown */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-bg-3">
                    <th className="pb-2 text-left text-xs font-medium uppercase tracking-wider text-fg-3">Team Member</th>
                    <th className="pb-2 text-right text-xs font-medium uppercase tracking-wider text-fg-3">Conversations</th>
                    <th className="pb-2 text-right text-xs font-medium uppercase tracking-wider text-fg-3 hidden sm:table-cell">Messages</th>
                    <th className="pb-2 text-right text-xs font-medium uppercase tracking-wider text-fg-3">Tasks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bg-2">
                  {data.byArchetype.map((a) => (
                    <tr key={a.slug}>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${a.color}`} />
                          <span className="text-fg-2">{a.label}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-right text-fg-2 tabular-nums">{a.conversations.toLocaleString()}</td>
                      <td className="py-2.5 text-right text-fg-2 tabular-nums hidden sm:table-cell">{a.messages.toLocaleString()}</td>
                      <td className="py-2.5 text-right text-fg-2 tabular-nums">{a.tasks.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Token usage */}
          {tokenData && (
            <div className="card p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
                <div>
                  <h2 className="heading-2">API Token Usage</h2>
                  <p className="text-sm text-fg-3 mt-0.5">
                    Anthropic token consumption for this period.
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-fg-1/5 px-3 py-2 self-start">
                  <Cpu size={14} className="text-fg-3" />
                  <span className="text-sm font-medium text-fg-1">
                    Est. cost: ${tokenData.estimatedCostUsd.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
                <div className="rounded-lg bg-bg-1 p-4">
                  <p className="text-xs uppercase tracking-wider text-fg-3 mb-1">Input tokens</p>
                  <p className="text-xl font-mono font-medium text-fg-1">
                    {formatTokens(tokenData.totalInputTokens)}
                  </p>
                </div>
                <div className="rounded-lg bg-bg-1 p-4">
                  <p className="text-xs uppercase tracking-wider text-fg-3 mb-1">Output tokens</p>
                  <p className="text-xl font-mono font-medium text-fg-1">
                    {formatTokens(tokenData.totalOutputTokens)}
                  </p>
                </div>
                <div className="rounded-lg bg-bg-1 p-4">
                  <p className="text-xs uppercase tracking-wider text-fg-3 mb-1">Cache reads</p>
                  <p className="text-xl font-mono font-medium text-fg-1">
                    {formatTokens(tokenData.totalCacheReadTokens)}
                  </p>
                </div>
                <div className="rounded-lg bg-bg-1 p-4">
                  <p className="text-xs uppercase tracking-wider text-fg-3 mb-1">Total tokens</p>
                  <p className="text-xl font-mono font-medium text-fg-1">
                    {formatTokens(tokenData.grandTotal)}
                  </p>
                </div>
              </div>

              {tokenData.topConversations.length > 0 && (
                <div className="overflow-x-auto">
                  <p className="text-xs font-medium uppercase tracking-wider text-fg-3 mb-3">
                    Top conversations by token usage
                  </p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-bg-3">
                        <th className="pb-2 text-left text-xs font-medium uppercase tracking-wider text-fg-3">
                          Conversation
                        </th>
                        <th className="pb-2 text-right text-xs font-medium uppercase tracking-wider text-fg-3">
                          Input
                        </th>
                        <th className="pb-2 text-right text-xs font-medium uppercase tracking-wider text-fg-3">
                          Output
                        </th>
                        <th className="pb-2 text-right text-xs font-medium uppercase tracking-wider text-fg-3">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-bg-2">
                      {tokenData.topConversations.map((c) => (
                        <tr key={c.conversationId}>
                          <td className="py-2.5 text-fg-2 max-w-[200px] truncate">
                            {c.title ?? c.conversationId.slice(0, 8) + "…"}
                          </td>
                          <td className="py-2.5 text-right text-fg-2 tabular-nums font-mono">
                            {formatTokens(c.inputTokens)}
                          </td>
                          <td className="py-2.5 text-right text-fg-2 tabular-nums font-mono">
                            {formatTokens(c.outputTokens)}
                          </td>
                          <td className="py-2.5 text-right text-fg-1 tabular-nums font-mono font-medium">
                            {formatTokens(c.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {tokenData.grandTotal === 0 && (
                <p className="text-sm text-fg-3 py-4">
                  No token data yet for this period. Token tracking starts from the next
                  conversation after this update.
                </p>
              )}
            </div>
          )}

          {/* Hourly distribution */}
          <div className="card p-6">
            <h2 className="heading-2 mb-1">Most Active Hours</h2>
            <p className="text-sm text-fg-3 mb-6">When your team sees the most activity.</p>
            <UsageChart
              data={data.hourlyDistribution.map((h) => ({
                label: h.label,
                value: h.value,
                color: "bg-brand-400",
              }))}
              valueLabel=" msgs"
            />
          </div>
        </>
      )}
    </div>
  );
}
