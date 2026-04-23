"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { ARCHETYPE_CONFIG, ARCHETYPE_SLUGS } from "@/lib/archetype-config";
import { getLocalConversations } from "./[slug]/api";
import { useEffect, useState } from "react";
import type { ArchetypeSlug } from "@/app/dashboard/inbox/heartbeats";
import { useArchetypeNames } from "@/hooks/useArchetypeNames";

function formatRelativeTime(isoTimestamp: string | null | undefined): string {
  if (!isoTimestamp) return "No conversations yet";
  const diffMs = Date.now() - new Date(isoTimestamp).getTime();
  if (diffMs < 0) return "Just now";
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  const diffWk = Math.floor(diffDay / 7);
  if (diffWk < 5) return `${diffWk}w ago`;
  const diffMo = Math.floor(diffDay / 30);
  return `${diffMo}mo ago`;
}

export default function TeamPage() {
  const [lastMessages, setLastMessages] = useState<Record<string, string>>({});
  const [lastActiveTs, setLastActiveTs] = useState<Record<string, string | null>>({});
  const { names: archetypeNames } = useArchetypeNames();

  useEffect(() => {
    const previews: Record<string, string> = {};
    for (const slug of ARCHETYPE_SLUGS) {
      const convos = getLocalConversations(slug);
      if (convos.length > 0) {
        previews[slug] = convos[0].title;
      }
    }
    setLastMessages(previews);
  }, []);

  useEffect(() => {
    async function fetchLastActive() {
      try {
        const res = await fetch("/api/team/last-active");
        if (res.ok) {
          const data = (await res.json()) as Record<string, string | null>;
          setLastActiveTs(data);
          return;
        }
      } catch {
        // Network error — fall through to localStorage fallback
      }
      const timestamps: Record<string, string | null> = {};
      for (const slug of ARCHETYPE_SLUGS) {
        const convos = getLocalConversations(slug);
        timestamps[slug] = convos.length > 0 ? (convos[0].updatedAt ?? null) : null;
      }
      setLastActiveTs(timestamps);
    }
    void fetchLastActive();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="heading-1">Your AI team</h1>
        <p className="mt-1 text-fg-3">
          Meet the leaders powering your organization. Click any card to start a conversation.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {ARCHETYPE_SLUGS.map((slug) => {
          const config = ARCHETYPE_CONFIG[slug as ArchetypeSlug];
          const Icon = config.icon;
          const lastActive = formatRelativeTime(lastActiveTs[slug]);
          const lastMsg = lastMessages[slug];
          const customName = archetypeNames[slug];

          return (
            <Link
              key={slug}
              href={`/dashboard/team/${slug}`}
              className="bg-bg-2 shadow-elev-1 rounded-lg overflow-hidden hover:shadow-elev-2 transition-shadow group"
            >
              {/* Color accent top bar */}
              <div className={`h-1 w-full ${config.bg}`} />

              <div className="p-5">
                {/* Header row */}
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${config.bg}`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  {/* Online indicator */}
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 text-xs font-medium text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active
                  </span>
                </div>

                {/* Name and role */}
                <div className="mt-4">
                  {customName ? (
                    <>
                      <h3 className="text-sm font-semibold text-fg-1 leading-tight">
                        {customName}
                      </h3>
                      <p className="mt-0.5 text-xs font-medium text-fg-3">
                        {config.label}
                      </p>
                    </>
                  ) : (
                    <h3 className="text-sm font-semibold text-fg-1 leading-tight">
                      {config.label}
                    </h3>
                  )}
                  <p className="mt-1 text-xs text-fg-3 leading-relaxed">
                    {config.description}
                  </p>
                </div>

                {/* Last message or invite */}
                <div className="mt-4 min-h-[2.5rem]">
                  {lastMsg ? (
                    <p className="text-xs text-fg-4 italic truncate">
                      &ldquo;{lastMsg}&rdquo;
                    </p>
                  ) : (
                    <p className="text-xs text-fg-4">
                      Start a conversation
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-fg-4">{lastActive}</span>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium ${config.text} group-hover:underline`}
                  >
                    <MessageSquare size={12} />
                    Chat
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
