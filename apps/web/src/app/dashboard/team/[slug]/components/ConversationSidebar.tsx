"use client";

import { useState } from "react";
import { Plus, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import type { Conversation } from "../api";
import { cn } from "@/lib/utils";

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelect: (conversation: Conversation) => void;
  onNew: () => void;
  isCreating: boolean;
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ConversationSidebar({
  conversations,
  activeConversationId,
  onSelect,
  onNew,
  isCreating,
}: ConversationSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Collapsed state — just a toggle button */}
      {collapsed ? (
        <div className="flex flex-col items-center py-4 border-r border-[var(--line-1)] bg-[var(--bg-1)] w-10">
          <button
            onClick={() => setCollapsed(false)}
            className="p-1.5 rounded-lg text-[var(--fg-3)] hover:text-[var(--fg-1)] hover:bg-[var(--bg-2)] transition"
            aria-label="Expand conversation list"
          >
            <ChevronRight size={16} />
          </button>
          <div className="mt-4 flex flex-col gap-2">
            {conversations.slice(0, 5).map((conv) => (
              <button
                key={conv.id}
                onClick={() => {
                  onSelect(conv);
                  setCollapsed(false);
                }}
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-white text-xs transition",
                  activeConversationId === conv.id
                    ? "bg-brand-500"
                    : "bg-[var(--bg-3)] hover:bg-[var(--bg-2)] text-[var(--fg-2)]"
                )}
                title={conv.title}
              >
                {(conv.title?.[0] ?? "?").toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="w-64 shrink-0 flex flex-col border-r border-[var(--line-1)] bg-[var(--bg-1)] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--line-1)]">
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--fg-3)]">
              Conversations
            </span>
            <button
              onClick={() => setCollapsed(true)}
              className="p-1 rounded text-[var(--fg-3)] hover:text-[var(--fg-1)] hover:bg-[var(--bg-2)] transition"
              aria-label="Collapse conversation list"
            >
              <ChevronLeft size={14} />
            </button>
          </div>

          {/* New conversation button */}
          <div className="px-3 py-2">
            <button
              onClick={onNew}
              disabled={isCreating}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-60 transition"
            >
              <Plus size={15} />
              New conversation
            </button>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
            {conversations.length === 0 ? (
              <div className="text-center px-4 py-8 text-sm text-[var(--fg-3)]">
                No conversations yet
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => onSelect(conv)}
                  className={cn(
                    "w-full flex items-start gap-2 px-3 py-2.5 rounded-lg text-left transition",
                    activeConversationId === conv.id
                      ? "bg-white/15 text-[var(--fg-1)]"
                      : "text-[var(--fg-2)] hover:bg-white/10"
                  )}
                >
                  <MessageSquare
                    size={14}
                    className={cn(
                      "shrink-0 mt-0.5",
                      activeConversationId === conv.id
                        ? "text-brand-400"
                        : "text-[var(--fg-3)]"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate leading-tight">
                      {conv.title}
                    </p>
                    <p className="text-xs text-[var(--fg-3)] mt-0.5">
                      {formatDate(conv.updatedAt)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
