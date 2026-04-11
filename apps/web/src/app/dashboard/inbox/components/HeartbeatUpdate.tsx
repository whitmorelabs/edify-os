"use client";

import { ArrowRight, MessageSquare } from "lucide-react";
import Link from "next/link";
import { ARCHETYPE_CONFIG } from "@/lib/archetype-config";
import type { HeartbeatResult } from "@/app/dashboard/inbox/heartbeats";

interface HeartbeatUpdateProps {
  result: HeartbeatResult;
  onDiscuss?: (archetype: string) => void;
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function HeartbeatUpdate({ result, onDiscuss }: HeartbeatUpdateProps) {
  const meta = ARCHETYPE_CONFIG[result.archetype];
  if (!meta) return null;

  // Don't render skipped results as cards
  if (result.status === "skipped" || !result.title) return null;

  return (
    <div className={`card border-l-4 ${meta.border} overflow-hidden`}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.bg}`}
          >
            <meta.icon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-sm font-semibold ${meta.text}`}>{meta.label}</span>
              <span className="text-xs text-slate-400">&mdash; {timeAgo(result.timestamp)}</span>
            </div>
            {/* Title */}
            <h3 className="mt-1 font-semibold text-slate-900 text-sm leading-snug">
              {result.title}
            </h3>
          </div>
        </div>

        {/* Body */}
        {result.body && (
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">{result.body}</p>
        )}

        {/* Suggested action */}
        {result.suggestedAction && (
          <div className="mt-3 rounded-lg bg-brand-50 border border-brand-100 p-3">
            <p className="text-xs font-medium text-brand-700 uppercase tracking-wider mb-1">
              Suggested next step
            </p>
            {result.suggestedActionUrl ? (
              <Link
                href={result.suggestedActionUrl}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                {result.suggestedAction}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <p className="text-sm text-brand-800">{result.suggestedAction}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => onDiscuss?.(result.archetype)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Discuss with {meta.label}
          </button>
        </div>
      </div>
    </div>
  );
}
