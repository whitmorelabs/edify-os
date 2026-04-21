"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  CheckSquare,
  Users,
  Plug,
  ChevronRight,
  Shield,
  BarChart2,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import type { AdminStats } from "@/app/api/admin/stats/route";

type OverviewCard = {
  key: keyof AdminStats;
  label: string;
  emptyLabel: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
};

const overviewCards: OverviewCard[] = [
  {
    key: "teamConversationsThisWeek",
    label: "Team conversations this week",
    emptyLabel: "No team activity yet",
    icon: MessageSquare,
    iconBg: "bg-brand-50",
    iconColor: "text-brand-500",
  },
  {
    key: "tasksCompleted",
    label: "Tasks completed",
    emptyLabel: "No tasks completed yet",
    icon: CheckSquare,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    key: "activeTeamMembers",
    label: "Team members",
    emptyLabel: "No teammates yet",
    icon: Users,
    iconBg: "bg-sky-50",
    iconColor: "text-sky-600",
  },
  {
    key: "connectedIntegrations",
    label: "Connected integrations",
    emptyLabel: "No integrations connected",
    icon: Plug,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
];

const quickLinks = [
  {
    href: "/dashboard/admin/members",
    label: "Manage Members",
    description: "Invite people, change roles, and remove access.",
    icon: Users,
    iconBg: "bg-sky-50",
    iconColor: "text-sky-600",
  },
  {
    href: "/dashboard/admin/usage",
    label: "View Usage",
    description: "See how your team is using Edify OS.",
    icon: BarChart2,
    iconBg: "bg-brand-50",
    iconColor: "text-brand-500",
  },
  {
    href: "/dashboard/admin/ai-config",
    label: "AI Configuration",
    description: "Toggle team members, set autonomy levels, and configure instructions.",
    icon: Settings2,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
];

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {overviewCards.map((card) => (
        <div key={card.key} className="card p-5 animate-pulse">
          <div className="mb-3 h-10 w-10 rounded-lg bg-gray-200" />
          <div className="h-8 w-12 rounded bg-gray-200" />
          <div className="mt-2 h-4 w-32 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: AdminStats | null) => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
          <Shield className="h-5 w-5 text-brand-500" />
        </div>
        <div>
          <h1 className="heading-1">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your team, monitor usage, and configure Edify OS for your organization.
          </p>
        </div>
      </div>

      {/* Overview cards */}
      {loading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {overviewCards.map((card) => {
            const Icon = card.icon;
            const value = stats?.[card.key] ?? 0;
            const isEmpty = value === 0;
            return (
              <div key={card.key} className="card p-5">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.iconBg} mb-3`}
                >
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
                {isEmpty ? (
                  <>
                    <p className="text-3xl font-bold text-slate-300">0</p>
                    <p className="mt-1 text-sm text-slate-500">{card.emptyLabel}</p>
                  </>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-slate-900">{value}</p>
                    <p className="mt-1 text-sm text-slate-500">{card.label}</p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Quick links */}
      <div>
        <h2 className="heading-2 mb-4">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="card-interactive p-5 flex items-start gap-4"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${link.iconBg}`}
                >
                  <Icon className={`h-5 w-5 ${link.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 flex items-center gap-1">
                    {link.label}
                    <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                  </p>
                  <p className="text-sm text-slate-500 mt-0.5">{link.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
