"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Download } from "lucide-react";
import type { Message, GeneratedFile } from "../api";
import type { ArchetypeSlug } from "@/app/dashboard/inbox/heartbeats";
import { ARCHETYPE_CONFIG } from "@/lib/archetype-config";
import { relativeTime } from "@/lib/utils";
import { ARCHETYPES, ChatBubble, TypingIndicator, FileCard } from "@/components/ui";
import type { Archetype, ArchetypeKey } from "@/components/ui";

interface ChatMessagesProps {
  messages: Message[];
  isTyping: boolean;
  /** ID of the assistant message currently being streamed — shows a blinking cursor. */
  streamingId?: string | null;
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
// File rendering — FileCard primitive replaces the old bare chip for non-image files
// ---------------------------------------------------------------------------

/** Derive the FileCard `type` prop from a MIME type string. */
function mimeToType(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.includes("pdf")) return "pdf";
  if (mimeType.includes("wordprocessingml") || mimeType.includes("word")) return "docx";
  return mimeType; // FileCard handles unknown extensions gracefully
}

// Inline image preview — for PNG/JPEG outputs from tools like render_design_to_image.
// If the image fails to load (404, expired, etc.), we fall back to FileCard in resting state.
function InlineImage({ file, messageTimestamp }: { file: GeneratedFile; messageTimestamp: string }) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <FileCard
        name={file.name}
        type={mimeToType(file.mimeType ?? "")}
        createdAt={messageTimestamp}
        href={file.downloadUrl}
        isNew={false}
        thumbnailUrl={file.downloadUrl}
      />
    );
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

interface FileChipsProps {
  files: GeneratedFile[];
  /** ISO timestamp of the parent message — used for FileCard's createdAt and isNew detection. */
  messageTimestamp: string;
  /** Whether to render non-image files in just-arrived (purple glow) state. */
  isNew: boolean;
}

function FileChips({ files, messageTimestamp, isNew }: FileChipsProps) {
  if (!files || files.length === 0) return null;

  const images = files.filter((f) => f.mimeType?.startsWith("image/"));
  const others = files.filter((f) => !f.mimeType?.startsWith("image/"));

  return (
    <>
      {images.length > 0 && (
        <div className="flex flex-col gap-2 mt-2">
          {images.map((f) => (
            <InlineImage key={f.downloadUrl} file={f} messageTimestamp={messageTimestamp} />
          ))}
        </div>
      )}
      {others.length > 0 && (
        <div className="flex flex-col gap-2 mt-2">
          {others.map((f) => (
            <FileCard
              key={f.downloadUrl}
              name={f.name}
              type={mimeToType(f.mimeType ?? "")}
              createdAt={messageTimestamp}
              href={f.downloadUrl}
              isNew={isNew}
            />
          ))}
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function ChatMessages({ messages, isTyping, streamingId, slug }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Resolve the UI archetype object for ChatBubble + TypingIndicator
  const arcKey: ArchetypeKey | undefined = SLUG_TO_KEY[slug];
  const arc: Archetype | undefined = arcKey ? ARCHETYPES[arcKey] : undefined;
  const directorLabel = ARCHETYPE_CONFIG[slug]?.label ?? "Director";

  // Find the last assistant message ID once — used to determine isNew per FileCard spec.
  // A message qualifies as just-arrived only if it is the most recent assistant message
  // AND its timestamp is within the last 30 seconds.
  const lastAssistantMsg = messages.findLast((m) => m.role === "assistant");
  const justArrivedId =
    lastAssistantMsg &&
    (Date.now() - new Date(lastAssistantMsg.timestamp).getTime()) / 1000 <= 30
      ? lastAssistantMsg.id
      : null;

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
        const fileIsNew = msg.id === justArrivedId;
        const isStreaming = msg.id === streamingId;
        return (
          <div key={msg.id} className="flex flex-col gap-0.5 animate-slide-up">
            {arc ? (
              <ChatBubble
                role="agent"
                arc={arc}
                trailing={
                  msg.files && msg.files.length > 0 ? (
                    <FileChips
                      files={msg.files}
                      messageTimestamp={msg.timestamp}
                      isNew={fileIsNew}
                    />
                  ) : undefined
                }
              >
                {msg.content ? (
                  <AssistantMarkdown content={msg.content} />
                ) : (
                  // Waiting for first chunk — show a subtle pulse
                  <span className="inline-block h-4 w-4 rounded-sm bg-current opacity-30 animate-pulse" />
                )}
                {isStreaming && msg.content && (
                  <span
                    aria-hidden="true"
                    className="inline-block w-0.5 h-4 bg-current opacity-60 ml-0.5 align-text-bottom animate-[blink_1s_step-end_infinite]"
                  />
                )}
              </ChatBubble>
            ) : (
              // Fallback if arc resolution fails
              <div
                className="max-w-[70%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-[14px] leading-[1.55] text-[var(--fg-1)]"
                style={{ background: "var(--bg-3)", boxShadow: "inset 0 0 0 1px var(--line-2)" }}
              >
                <AssistantMarkdown content={msg.content} />
                {msg.files && msg.files.length > 0 && (
                  <FileChips
                    files={msg.files}
                    messageTimestamp={msg.timestamp}
                    isNew={fileIsNew}
                  />
                )}
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
