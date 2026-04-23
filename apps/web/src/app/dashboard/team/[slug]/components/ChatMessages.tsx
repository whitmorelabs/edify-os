"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Download } from "lucide-react";
import type { Message, GeneratedFile } from "../api";
import type { ArchetypeSlug } from "@/app/dashboard/inbox/heartbeats";
import { ARCHETYPE_CONFIG } from "@/lib/archetype-config";
import { ARCHETYPES, ChatBubble, TypingIndicator } from "@/components/ui";
import type { Archetype, ArchetypeKey } from "@/components/ui";

interface ChatMessagesProps {
  messages: Message[];
  isTyping: boolean;
  slug: ArchetypeSlug;
}

// ---------------------------------------------------------------------------
// Slug → ArchetypeKey mapping (mirrors dashboard/page.tsx)
// ---------------------------------------------------------------------------
const SLUG_TO_KEY: Record<ArchetypeSlug, ArchetypeKey> = {
  executive_assistant: "exec",
  events_director: "events",
  development_director: "dev",
  marketing_director: "marketing",
  programs_director: "programs",
  hr_volunteer_coordinator: "hr",
};

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
      className="text-brand-400 underline hover:text-brand-300 break-words"
    />
  ),
  // Paragraphs
  p: ({ ...props }) => (
    <p {...props} className="text-sm leading-relaxed mb-1 last:mb-0" />
  ),
  // Headings
  h1: ({ ...props }) => (
    <h1 {...props} className="text-base font-bold text-[var(--fg-1)] mt-2 mb-1" />
  ),
  h2: ({ ...props }) => (
    <h2 {...props} className="text-sm font-bold text-[var(--fg-1)] mt-2 mb-0.5" />
  ),
  h3: ({ ...props }) => (
    <h3 {...props} className="text-sm font-semibold text-[var(--fg-2)] mt-1 mb-0.5" />
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
        <pre className="bg-[var(--bg-0)] rounded-lg px-3 py-2 my-1 overflow-x-auto text-xs font-mono border border-[var(--line-1)]">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      );
    }
    return (
      <code
        {...props}
        className="bg-[var(--bg-0)] rounded px-1 py-0.5 text-xs font-mono border border-[var(--line-1)]"
      >
        {children}
      </code>
    );
  },
  // Pre wrapper — handled inside code above to prevent double-wrapping
  pre: ({ ...props }) => <>{props.children}</>,
  // Blockquote
  blockquote: ({ ...props }) => (
    <blockquote
      {...props}
      className="border-l-2 border-[var(--line-2)] pl-3 text-[var(--fg-3)] italic my-1"
    />
  ),
  // Table (remark-gfm)
  table: ({ ...props }) => (
    <div className="overflow-x-auto my-1">
      <table {...props} className="text-xs border-collapse w-full" />
    </div>
  ),
  th: ({ ...props }) => (
    <th
      {...props}
      className="border border-[var(--line-2)] px-2 py-1 bg-[var(--bg-0)] font-semibold text-left text-[var(--fg-2)]"
    />
  ),
  td: ({ ...props }) => (
    <td {...props} className="border border-[var(--line-2)] px-2 py-1 text-[var(--fg-2)]" />
  ),
};

function AssistantMarkdown({ content }: { content: string }) {
  // Defensive: coerce to string in case a non-string value leaks through.
  const safeContent = typeof content === "string" ? content : String(content ?? "");
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
      {safeContent}
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
  png: "PNG Image",
  jpg: "JPEG Image",
  jpeg: "JPEG Image",
};

function FileChip({ file }: { file: GeneratedFile }) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const label = FILE_EXT_LABEL[ext] ?? "File";

  return (
    <a
      href={file.downloadUrl}
      download={file.name}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line-purple)] bg-[var(--bg-2)] px-3 py-1.5 text-xs font-medium text-brand-400 hover:bg-[var(--bg-3)] transition"
    >
      <Download size={12} className="shrink-0" />
      <span className="truncate max-w-[200px]">{file.name}</span>
      <span className="text-[var(--fg-3)]">({label})</span>
    </a>
  );
}

// Inline image preview — for PNG/JPEG outputs from tools like render_design_to_image.
// If the image fails to load (404, expired, etc.), we fall back to the plain FileChip.
function InlineImage({ file }: { file: GeneratedFile }) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return <FileChip file={file} />;
  }

  return (
    <figure className="mt-2 inline-block max-w-full">
      <img
        src={file.downloadUrl}
        alt={file.name}
        aria-label={file.name}
        loading="lazy"
        onError={() => setErrored(true)}
        className="block h-auto w-auto max-w-full sm:max-w-[420px] rounded-lg border border-[var(--line-1)]"
      />
      <figcaption className="mt-1.5">
        <a
          href={file.downloadUrl}
          download={file.name}
          className="inline-flex items-center gap-1 text-xs text-[var(--fg-3)] hover:text-brand-400 hover:underline"
        >
          <Download size={11} className="shrink-0" />
          <span className="truncate max-w-[260px]">Download {file.name}</span>
        </a>
      </figcaption>
    </figure>
  );
}

function FileChips({ files }: { files: GeneratedFile[] }) {
  if (!files || files.length === 0) return null;

  const images = files.filter((f) => f.mimeType?.startsWith("image/"));
  const others = files.filter((f) => !f.mimeType?.startsWith("image/"));

  return (
    <>
      {images.length > 0 && (
        <div className="flex flex-col gap-2 mt-2">
          {images.map((f) => (
            <InlineImage key={f.downloadUrl} file={f} />
          ))}
        </div>
      )}
      {others.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {others.map((f) => (
            <FileChip key={f.downloadUrl} file={f} />
          ))}
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function ChatMessages({ messages, isTyping, slug }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Resolve the UI archetype object for ChatBubble + TypingIndicator
  const arcKey: ArchetypeKey | undefined = SLUG_TO_KEY[slug];
  const arc: Archetype | undefined = arcKey ? ARCHETYPES[arcKey] : undefined;
  const directorLabel = ARCHETYPE_CONFIG[slug]?.label ?? "Director";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg) => {
        const isUser = msg.role === "user";

        if (isUser) {
          return (
            <div key={msg.id} className="flex flex-col items-end gap-0.5 animate-slide-up">
              <ChatBubble role="user">
                <span className="whitespace-pre-wrap">{msg.content}</span>
              </ChatBubble>
              <p className="text-[10px] font-mono text-[var(--fg-3)] px-1">
                {relativeTime(msg.timestamp)}
              </p>
            </div>
          );
        }

        // Assistant message — use ChatBubble primitive with archetype arc
        return (
          <div key={msg.id} className="flex flex-col gap-0.5 animate-slide-up">
            {arc ? (
              <ChatBubble
                role="agent"
                arc={arc}
                trailing={
                  msg.files && msg.files.length > 0 ? (
                    <FileChips files={msg.files} />
                  ) : undefined
                }
              >
                <AssistantMarkdown content={msg.content} />
              </ChatBubble>
            ) : (
              // Fallback if arc resolution fails
              <div
                className="max-w-[70%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-[14px] leading-[1.55] text-[var(--fg-1)]"
                style={{ background: "var(--bg-3)", boxShadow: "inset 0 0 0 1px var(--line-2)" }}
              >
                <AssistantMarkdown content={msg.content} />
                {msg.files && msg.files.length > 0 && <FileChips files={msg.files} />}
              </div>
            )}
            <p className="text-[10px] font-mono text-[var(--fg-3)] pl-9">
              {relativeTime(msg.timestamp)}
            </p>
          </div>
        );
      })}

      {/* Typing indicator */}
      {isTyping && (
        <div className="flex justify-start animate-slide-up">
          <TypingIndicator label={`${directorLabel} is thinking`} />
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
