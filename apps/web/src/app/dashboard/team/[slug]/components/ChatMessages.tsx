"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Download } from "lucide-react";
import type { Message, GeneratedFile } from "../api";
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
// Markdown renderer — react-markdown + remark-gfm
// Renders links, bold, italic, lists, code blocks, tables, strikethrough.
// Links open in a new tab. Raw HTML is NOT allowed (react-markdown default).
// ---------------------------------------------------------------------------

// Stable reference — defined outside the component so the object is not
// recreated on every render (avoids unnecessary ReactMarkdown re-mounts).
const MARKDOWN_COMPONENTS: Components = {
  // Links: open in new tab, safe rel
  a: ({ ...props }) => (
    <a
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      className="text-brand-600 underline hover:text-brand-800 break-words"
    />
  ),
  // Paragraphs
  p: ({ ...props }) => (
    <p {...props} className="text-sm leading-relaxed mb-1 last:mb-0" />
  ),
  // Headings
  h1: ({ ...props }) => (
    <h1 {...props} className="text-base font-bold text-slate-900 mt-2 mb-1" />
  ),
  h2: ({ ...props }) => (
    <h2 {...props} className="text-sm font-bold text-slate-800 mt-2 mb-0.5" />
  ),
  h3: ({ ...props }) => (
    <h3 {...props} className="text-sm font-semibold text-slate-700 mt-1 mb-0.5" />
  ),
  // Lists
  ul: ({ ...props }) => (
    <ul {...props} className="list-disc pl-5 text-sm space-y-0.5 my-1" />
  ),
  ol: ({ ...props }) => (
    <ol {...props} className="list-decimal pl-5 text-sm space-y-0.5 my-1" />
  ),
  li: ({ ...props }) => (
    <li {...props} className="text-sm leading-relaxed" />
  ),
  // Inline and block code
  code: ({ className, children, ...props }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <pre className="bg-slate-100 rounded-lg px-3 py-2 my-1 overflow-x-auto text-xs font-mono">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      );
    }
    return (
      <code
        {...props}
        className="bg-slate-100 rounded px-1 py-0.5 text-xs font-mono"
      >
        {children}
      </code>
    );
  },
  // Pre wrapper — handled inside code above to prevent double-wrapping
  pre: ({ ...props }) => <>{props.children}</>,
  // Bold / italic / strikethrough — rely on react-markdown defaults
  // Blockquote
  blockquote: ({ ...props }) => (
    <blockquote
      {...props}
      className="border-l-2 border-slate-300 pl-3 text-slate-600 italic my-1"
    />
  ),
  // Table (remark-gfm)
  table: ({ ...props }) => (
    <div className="overflow-x-auto my-1">
      <table {...props} className="text-xs border-collapse w-full" />
    </div>
  ),
  th: ({ ...props }) => (
    <th {...props} className="border border-slate-200 px-2 py-1 bg-slate-50 font-semibold text-left" />
  ),
  td: ({ ...props }) => (
    <td {...props} className="border border-slate-200 px-2 py-1" />
  ),
};

function AssistantMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
      {content}
    </ReactMarkdown>
  );
}

// ---------------------------------------------------------------------------
// File download chip — shown below assistant message when a skill generated a file
// ---------------------------------------------------------------------------
const FILE_EXT_LABEL: Record<string, string> = {
  docx: "Word Doc",
  xlsx: "Excel",
  pptx: "PowerPoint",
  pdf: "PDF",
};

function FileChip({ file }: { file: GeneratedFile }) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const label = FILE_EXT_LABEL[ext] ?? "File";

  return (
    <a
      href={file.downloadUrl}
      download={file.name}
      className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100 hover:border-brand-300 transition"
    >
      <Download size={12} className="shrink-0" />
      <span className="truncate max-w-[200px]">{file.name}</span>
      <span className="text-brand-400">({label})</span>
    </a>
  );
}

function FileChips({ files }: { files: GeneratedFile[] }) {
  if (!files || files.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {files.map((f) => (
        <FileChip key={f.downloadUrl} file={f} />
      ))}
    </div>
  );
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
                      <AssistantMarkdown content={msg.content} />
                      {msg.files && msg.files.length > 0 && (
                        <FileChips files={msg.files} />
                      )}
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
