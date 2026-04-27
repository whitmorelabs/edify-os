"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Waves,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  FileText,
  Calendar,
  Flag,
  PlusCircle,
  Loader2,
} from "lucide-react";
import { AGENT_COLORS, type AgentRoleSlug } from "@/lib/agent-colors";
import { EVENT_TYPES, type EventType } from "@/lib/ripple/event-types";
import type {
  RippleEventRow,
  RippleActionRow,
} from "@/app/api/ripple/events/route";

type StatusFilter = "all" | "pending" | "approved" | "dismissed";

const ACTION_TYPE_ICONS: Record<string, typeof FileText> = {
  draft: FileText,
  schedule: Calendar,
  flag: Flag,
  create: PlusCircle,
};

const STATUS_STYLES: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  pending: { label: "Pending", bg: "bg-amber-100", text: "text-amber-800" },
  approved: {
    label: "Approved",
    bg: "bg-emerald-100",
    text: "text-emerald-800",
  },
  dismissed: { label: "Dismissed", bg: "bg-slate-100", text: "text-slate-500" },
};

function formatTimeAgo(iso: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString();
}

function AgentBadge({ slug }: { slug: string }) {
  const config = AGENT_COLORS[slug as AgentRoleSlug];
  if (!config) {
    return (
      <span className="text-xs text-fg-3 font-medium">{slug}</span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full shrink-0 ${config.bg}`} />
      <span className="text-xs font-medium text-fg-2">{config.label}</span>
    </span>
  );
}

function ActionCard({
  action,
  onStatusChange,
}: {
  action: RippleActionRow;
  onStatusChange: (id: string, status: string) => void;
}) {
  const ActionIcon = ACTION_TYPE_ICONS[action.action_type] ?? Flag;
  const statusStyle = STATUS_STYLES[action.status] ?? STATUS_STYLES.pending;
  const isPending = action.status === "pending";

  return (
    <div className="flex items-start gap-3 rounded-lg border border-bg-3 bg-bg-1 p-3 transition hover:border-brand-300/40">
      <div className="mt-0.5 shrink-0 rounded-md bg-bg-2 p-1.5">
        <ActionIcon size={14} className="text-fg-3" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <AgentBadge slug={action.target_agent} />
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyle.bg} ${statusStyle.text}`}
          >
            {statusStyle.label}
          </span>
        </div>
        <p className="text-sm font-medium text-fg-1 leading-snug">
          {action.title}
        </p>
        {action.content && (
          <p className="mt-1 text-xs text-fg-3 leading-relaxed line-clamp-3">
            {action.content}
          </p>
        )}
      </div>

      {isPending && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onStatusChange(action.id, "approved")}
            className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50 transition"
            title="Approve"
          >
            <Check size={16} />
          </button>
          <button
            onClick={() => onStatusChange(action.id, "dismissed")}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 transition"
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function EventCard({
  event,
  onActionStatusChange,
  statusFilter,
}: {
  event: RippleEventRow;
  onActionStatusChange: (id: string, status: string) => void;
  statusFilter: StatusFilter;
}) {
  const [expanded, setExpanded] = useState(true);

  const eventConfig = EVENT_TYPES[event.event_type as EventType];
  const eventLabel = eventConfig?.label ?? event.event_type;

  const filteredActions =
    statusFilter === "all"
      ? event.actions
      : event.actions.filter((a) => a.status === statusFilter);

  const pendingCount = event.actions.filter(
    (a) => a.status === "pending",
  ).length;
  const totalCount = event.actions.length;

  if (filteredActions.length === 0 && statusFilter !== "all") return null;

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 p-4 text-left hover:bg-bg-2/50 transition"
      >
        {expanded ? (
          <ChevronDown size={16} className="text-fg-3 shrink-0" />
        ) : (
          <ChevronRight size={16} className="text-fg-3 shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="inline-flex items-center rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
              {eventLabel}
            </span>
            <span className="text-xs text-fg-4">
              {formatTimeAgo(event.created_at)}
            </span>
          </div>
          <p className="text-sm font-semibold text-fg-1 truncate">
            {event.payload.title}
          </p>
          <p className="text-xs text-fg-3 mt-0.5 truncate">
            {event.payload.details}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <AgentBadge slug={event.source_agent} />
          <span className="text-xs text-fg-4">
            {pendingCount > 0
              ? `${pendingCount} pending`
              : `${totalCount} action${totalCount === 1 ? "" : "s"}`}
          </span>
        </div>
      </button>

      {expanded && filteredActions.length > 0 && (
        <div className="border-t border-bg-3 px-4 py-3 space-y-2">
          {filteredActions.map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              onStatusChange={onActionStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function RipplePage() {
  const [events, setEvents] = useState<RippleEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const fetchEvents = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/ripple/events", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch events");
        return res.json();
      })
      .then((data: RippleEventRow[]) => {
        setEvents(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleActionStatusChange = useCallback(
    (actionId: string, newStatus: string) => {
      // Optimistic update
      setEvents((prev) =>
        prev.map((ev) => ({
          ...ev,
          actions: ev.actions.map((a) =>
            a.id === actionId ? { ...a, status: newStatus } : a,
          ),
        })),
      );

      // Persist to server
      fetch("/api/ripple/actions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: actionId, status: newStatus }),
      }).catch(() => {
        // Revert on failure
        fetchEvents();
      });
    },
    [fetchEvents],
  );

  const pendingTotal = events.reduce(
    (acc, ev) =>
      acc + ev.actions.filter((a) => a.status === "pending").length,
    0,
  );

  const filters: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: `Pending${pendingTotal > 0 ? ` (${pendingTotal})` : ""}` },
    { key: "approved", label: "Approved" },
    { key: "dismissed", label: "Dismissed" },
  ];

  const visibleEvents = events.filter((ev) => {
    if (statusFilter === "all") return true;
    return ev.actions.some((a) => a.status === statusFilter);
  });

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-1">
          <Waves size={22} className="text-brand-500" />
          <h1 className="heading-1">Ripple</h1>
        </div>
        <p className="text-fg-3 text-sm">
          When something significant happens, your team coordinates
          automatically. Review and approve follow-up actions here.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              statusFilter === f.key
                ? "bg-brand-500 text-white"
                : "bg-bg-2 text-fg-3 hover:bg-bg-3"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-brand-500" />
        </div>
      )}

      {error && (
        <div className="card p-6 text-center">
          <p className="text-sm text-red-500">{error}</p>
          <button
            onClick={fetchEvents}
            className="mt-2 text-xs text-brand-500 hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && visibleEvents.length === 0 && (
        <div className="card p-10 text-center">
          <Waves size={40} className="mx-auto mb-3 text-fg-4/40" />
          <p className="text-sm font-medium text-fg-2 mb-1">No events yet</p>
          <p className="text-xs text-fg-4 max-w-sm mx-auto">
            When something significant happens in a conversation, your team will
            coordinate automatically. Try telling a team member about a grant
            award, a new hire, or a program milestone.
          </p>
        </div>
      )}

      {!loading && !error && visibleEvents.length > 0 && (
        <div className="space-y-3">
          {visibleEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onActionStatusChange={handleActionStatusChange}
              statusFilter={statusFilter}
            />
          ))}
        </div>
      )}
    </div>
  );
}
