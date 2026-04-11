"use client";

import { useEffect, useRef } from "react";
import type React from "react";
import type { Message } from "../api";
import type { ArchetypeSlug } from "@/app/dashboard/inbox/heartbeats";
import { ARCHETYPE_CONFIG } from "@/lib/archetype-config";
import { cn } from "@/lib/utils";

interface ChatMessagesProps {
  messages: Message[];
  isTyping: boolean;
  slug: ArchetypeSlug;
}

// ---------------------------------------------------------------------------
// Relative timestamp
// ---------------------------------------------------------------------------
function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);

  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ---------------------------------------------------------------------------
// Simple markdown renderer — handles **bold**, *italic*, headers, and lists
// ---------------------------------------------------------------------------
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const result: React.ReactNode[] = [];

  lines.forEach((line, lineIndex) => {
    // Heading
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      const className =
        level === 1
          ? "text-base font-bold text-slate-900 mt-2 mb-1"
          : level === 2
          ? "text-sm font-bold text-slate-800 mt-2 mb-0.5"
          : "text-sm font-semibold text-slate-700 mt-1 mb-0.5";
      result.push(
        <p key={lineIndex} className={className}>
          {inlineMarkdown(content)}
        </p>
      );
      return;
    }

    // Unordered list
    const bulletMatch = line.match(/^[\-\*]\s+(.+)/);
    if (bulletMatch) {
      result.push(
        <li key={lineIndex} className="ml-4 list-disc text-sm leading-relaxed">
          {inlineMarkdown(bulletMatch[1])}
        </li>
      );
      return;
    }

    // Numbered list
    const numMatch = line.match(/^\d+\.\s+(.+)/);
    if (numMatch) {
      result.push(
        <li key={lineIndex} className="ml-4 list-decimal text-sm leading-relaxed">
          {inlineMarkdown(numMatch[1])}
        </li>
      );
      return;
    }

    // Empty line
    if (line.trim() === "") {
      result.push(<div key={lineIndex} className="h-2" />);
      return;
    }

    // Regular paragraph
    result.push(
      <p key={lineIndex} className="text-sm leading-relaxed">
        {inlineMarkdown(line)}
      </p>
    );
  });

  return result;
}

function inlineMarkdown(text: string): React.ReactNode {
  // Split on **bold**, *italic*, and `code`
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="bg-slate-100 rounded px-1 py-0.5 text-xs font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

// ---------------------------------------------------------------------------
// Typing indicator
// ---------------------------------------------------------------------------
function TypingBubble() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 inline-flex gap-1.5 items-center">
      {[0, 0.16, 0.32].map((delay, i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-slate-400 animate-bounce-dot"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Archetype avatar (inlined to avoid importing AgentAvatar which uses agent-colors only)
// ---------------------------------------------------------------------------
function ArchetypeAvatar({
  slug,
  size = "sm",
}: {
  slug: ArchetypeSlug;
  size?: "sm" | "md";
}) {
  const config = ARCHETYPE_CONFIG[slug];
  const Icon = config.icon;
  const sizeClass = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  const iconSize = size === "sm" ? 16 : 20;

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center shrink-0",
        config.bg,
        sizeClass
      )}
    >
      <Icon size={iconSize} className="text-white" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function ChatMessages({ messages, isTyping, slug }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg) => {
        const isUser = msg.role === "user";

        return (
          <div
            key={msg.id}
            className={cn(
              "flex animate-slide-up",
              isUser ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "flex gap-2 max-w-[85%] sm:max-w-[75%]",
                isUser ? "flex-row-reverse" : "flex-row"
              )}
            >
              {/* Archetype avatar for assistant messages */}
              {!isUser && (
                <div className="mt-1">
                  <ArchetypeAvatar slug={slug} size="sm" />
                </div>
              )}

              <div className={isUser ? "text-right" : "text-left"}>
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5",
                    isUser
                      ? "bg-brand-500 text-white rounded-br-sm"
                      : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                  )}
                >
                  {isUser ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  ) : (
                    <div className="space-y-0.5">
                      {renderMarkdown(msg.content)}
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1 px-1">
                  {relativeTime(msg.timestamp)}
                </p>
              </div>
            </div>
          </div>
        );
      })}

      {/* Typing indicator */}
      {isTyping && (
        <div className="flex justify-start animate-slide-up">
          <div className="flex gap-2">
            <ArchetypeAvatar slug={slug} size="sm" />
            <div className="mt-1">
              <TypingBubble />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
