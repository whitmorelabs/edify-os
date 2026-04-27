"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, Sparkles, PanelLeft } from "lucide-react";
import Link from "next/link";
import { ARCHETYPE_CONFIG, ARCHETYPE_SLUGS } from "@/lib/archetype-config";
import type { ArchetypeSlug } from "@/app/dashboard/inbox/heartbeats";
import { ChatMessages } from "./components/ChatMessages";
import { ChatInput } from "./components/ChatInput";
import { ConversationSidebar } from "./components/ConversationSidebar";
import {
  sendMessage as apiSendMessage,
  getConversations,
  getMessages,
  getMessagesFromServer,
  saveMessage,
  saveConversationMeta,
  getLocalConversations,
  generateTitle,
  deleteLocalConversation,
  type Message,
  type Conversation,
} from "./api";
import { cn } from "@/lib/utils";
import { useArchetypeNames } from "@/hooks/useArchetypeNames";
import { SuggestionChip } from "@/components/ui";
import type { EnabledAgentsMap } from "@/app/api/team/enabled/route";

// ---------------------------------------------------------------------------
// useStreamBuffer — smooth character-by-character reveal of streamed text
// ---------------------------------------------------------------------------
function useStreamBuffer(isStreaming: boolean) {
  const bufferRef = useRef("");       // Full text received so far
  const displayedRef = useRef("");    // Text currently shown to user
  const [displayText, setDisplayText] = useState("");
  const rafRef = useRef<number | undefined>(undefined);

  const addChunk = useCallback((chunk: string) => {
    bufferRef.current += chunk;
  }, []);

  useEffect(() => {
    if (!isStreaming) {
      // When streaming ends, show all remaining buffered text immediately
      if (bufferRef.current !== displayedRef.current) {
        setDisplayText(bufferRef.current);
        displayedRef.current = bufferRef.current;
      }
      if (rafRef.current !== undefined) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = undefined;
      }
      return;
    }

    // ~3 chars/frame at 60fps ≈ 180 chars/sec — smooth natural reading speed
    const CHARS_PER_FRAME = 3;

    function animate() {
      const buffer = bufferRef.current;
      const displayed = displayedRef.current;

      if (displayed.length < buffer.length) {
        const nextLen = Math.min(displayed.length + CHARS_PER_FRAME, buffer.length);
        const nextText = buffer.slice(0, nextLen);
        displayedRef.current = nextText;
        setDisplayText(nextText);
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== undefined) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = undefined;
      }
    };
  }, [isStreaming]);

  const reset = useCallback(() => {
    bufferRef.current = "";
    displayedRef.current = "";
    setDisplayText("");
  }, []);

  return { displayText, addChunk, reset };
}

// ---------------------------------------------------------------------------
// Suggested prompts per archetype
// ---------------------------------------------------------------------------
const SUGGESTED_PROMPTS: Record<string, string[]> = {
  development_director: [
    "Find grants we're eligible for in youth development",
    "Draft an LOI for a $25K community foundation grant",
    "Write a thank-you letter for a major donor",
    "What grants are due this month?",
  ],
  marketing_director: [
    "Create a 3-post social media series for our upcoming gala",
    "Write this month's newsletter",
    "Plan our content calendar for next month",
    "Review this draft for brand voice consistency",
  ],
  executive_assistant: [
    "Prep me for my board meeting next Tuesday",
    "Summarize action items from today's staff meeting",
    "Draft a professional response to this email",
    "What needs my attention this week?",
  ],
  programs_director: [
    "Build a logic model for our after-school tutoring program",
    "Draft the program section of our Q2 grant report",
    "Design an outcome survey for program participants",
    "Are we on track with our funder deliverables?",
  ],
  hr_volunteer_coordinator: [
    "Write a job description for a part-time Programs Coordinator",
    "Create a volunteer onboarding checklist",
    "Draft our remote work policy",
    "Design a volunteer recognition program",
  ],
  events_director: [
    "Build a timeline for our annual gala on June 15",
    "Create a run of show for our community open house",
    "Design sponsorship tiers for our fall fundraiser",
    "What are the make-or-break items for this event?",
  ],
};

// ---------------------------------------------------------------------------
// Empty state component
// ---------------------------------------------------------------------------
function EmptyState({
  slug,
  onPromptSelect,
}: {
  slug: ArchetypeSlug;
  onPromptSelect: (prompt: string) => void;
}) {
  const config = ARCHETYPE_CONFIG[slug];
  const Icon = config.icon;
  const prompts = SUGGESTED_PROMPTS[slug] ?? [];

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-2xl",
          config.bg
        )}
      >
        <Icon size={32} className="text-white" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-[var(--fg-1)]">
        Start a conversation with your {config.label}
      </h3>
      <p className="mt-1 text-sm text-[var(--fg-3)] max-w-sm">
        {config.description}. Ask anything — they know your organization.
      </p>

      {prompts.length > 0 && (
        <div className="mt-8 w-full max-w-md px-2 md:px-0">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--fg-3)] mb-3">
            Try one of these
          </p>
          <div className="flex flex-col items-stretch gap-2">
            {prompts.slice(0, 4).map((prompt, i) => (
              <SuggestionChip
                key={i}
                icon={<Sparkles size={14} />}
                onClick={() => onPromptSelect(prompt)}
                className="w-full text-left justify-start"
              >
                {prompt}
              </SuggestionChip>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------
export default function TeamChatClient({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;

  // Validate slug
  if (!ARCHETYPE_SLUGS.includes(slug as ArchetypeSlug)) {
    notFound();
  }

  const archetypeSlug = slug as ArchetypeSlug;
  const config = ARCHETYPE_CONFIG[archetypeSlug];
  const Icon = config.icon;

  const { names: archetypeNames } = useArchetypeNames();
  const customName = archetypeNames[archetypeSlug];
  // Display label: "Anna (Executive Assistant)" or "Executive Assistant"
  const displayLabel = customName ? `${customName} (${config.label})` : config.label;

  // Fetch enabled/disabled state — same source of truth as the sidebar indicator
  const [enabledAgents, setEnabledAgents] = useState<EnabledAgentsMap | null>(null);
  useEffect(() => {
    fetch("/api/team/enabled")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: EnabledAgentsMap | null) => setEnabledAgents(data))
      .catch(() => setEnabledAgents(null));
  }, []);
  const isEnabled = enabledAgents ? enabledAgents[archetypeSlug] !== false : true;

  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  // streamingId: ID of the assistant message currently being streamed in.
  // The UI uses this to find-and-update the partial message in place.
  const [streamingId, setStreamingId] = useState<string | null>(null);

  // Smooth character-by-character animation buffer — isStreaming is true while
  // streamingId is set. displayText drives what ChatMessages renders for the
  // active streaming bubble instead of the raw accumulated chunk content.
  const { displayText: streamingDisplayText, addChunk, reset: resetStreamBuffer } = useStreamBuffer(streamingId !== null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  // AbortController for the current streaming fetch — allows cleanup on unmount.
  const abortControllerRef = useRef<AbortController | null>(null);
  // Mirror streamingId in a ref so the cleanup useEffect can read it without deps.
  const streamingIdRef = useRef<string | null>(null);
  // Mirror activeConversation id in a ref for the cleanup effect.
  const activeConversationIdRef = useRef<string | null>(null);
  useEffect(() => { streamingIdRef.current = streamingId; }, [streamingId]);
  useEffect(() => { activeConversationIdRef.current = activeConversation?.id ?? null; }, [activeConversation]);

  // ---------------------------------------------------------------------------
  // Load conversations on mount — auto-select the most recent one
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // Load local conversations first (instant, while server fetch is in flight)
    const local = getLocalConversations(slug);
    setConversations(local);

    // Fetch conversations from the server (authoritative source)
    getConversations(slug)
      .then(async (remote) => {
        const remoteIds = new Set(remote.map((c) => c.id));
        const merged = [
          ...remote,
          ...local.filter((c) => !remoteIds.has(c.id)),
        ];
        setConversations(merged);
        if (merged.length > 0) {
          setActiveConversation((prev) => prev ?? merged[0]);
        }
      })
      .catch(() => {
        if (local.length > 0) {
          setActiveConversation((prev) => prev ?? local[0]);
        }
      })
      .finally(() => setConversationsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // ---------------------------------------------------------------------------
  // Load messages for active conversation — check localStorage first,
  // then fall back to the server if the local cache is empty.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      return;
    }

    const convId = activeConversation.id;
    const pendingKey = `chat:pending-stream:${convId}`;
    const hasPendingMarker = !!localStorage.getItem(pendingKey);

    const stored = getMessages(convId);
    if (stored.length > 0) {
      // Local cache hit — render immediately
      setMessages(stored);
    }

    if (hasPendingMarker || stored.length === 0) {
      // Either a stream was interrupted (pending marker) or no local messages —
      // fetch from server to recover any messages saved while the user was away.
      if (stored.length === 0) setMessages([]); // Clear stale messages from previous conv
      getMessagesFromServer(slug, convId)
        .then((serverMessages) => {
          if (serverMessages.length > 0) {
            setMessages(serverMessages);
            // Backfill localStorage so subsequent loads are instant
            localStorage.removeItem(`chat:messages:${convId}`);
            for (const msg of serverMessages) {
              saveMessage(convId, msg);
            }
          }
          // Clear the pending marker — server data is now loaded
          localStorage.removeItem(pendingKey);
        })
        .catch(() => {
          // Server unavailable — keep local messages if any
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation?.id]);

  // ---------------------------------------------------------------------------
  // Handle sending a message — streams the assistant response chunk by chunk
  // ---------------------------------------------------------------------------
  const handleSend = useCallback(
    async (content: string) => {
      setIsTyping(true);

      // Temp ID used for optimistic render; backfilled to server's ID on success.
      const tempConvId = activeConversation?.id ?? `temp-${crypto.randomUUID()}`;
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: new Date().toISOString(),
        conversationId: tempConvId,
      };
      setMessages((prev) => [...prev, userMsg]);

      // Pre-create a placeholder assistant message so we can stream into it.
      const placeholderId = `streaming-${crypto.randomUUID()}`;
      const placeholderMsg: Message = {
        id: placeholderId,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
        conversationId: tempConvId,
      };

      try {
        // Insert placeholder only after the user message is shown
        setMessages((prev) => [...prev, placeholderMsg]);
        setStreamingId(placeholderId);

        // Create an AbortController so we can cancel the stream on unmount.
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const response = await apiSendMessage(
          slug,
          content,
          activeConversation?.id,
          // onDelta: feed chunk into the animation buffer instead of directly
          // updating message state — the RAF loop in useStreamBuffer reveals it
          // character-by-character at ~180 chars/sec.
          (chunk: string) => {
            addChunk(chunk);
          },
          controller.signal
        );

        setStreamingId(null);
        resetStreamBuffer();
        abortControllerRef.current = null;

        const serverConvId = response.conversationId;
        const isNew = !activeConversation;
        const conv: Conversation = activeConversation
          ? { ...activeConversation, updatedAt: new Date().toISOString(), messageCount: activeConversation.messageCount + 2 }
          : {
              id: serverConvId,
              slug,
              title: generateTitle(content),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              messageCount: 2,
            };

        if (isNew) {
          saveMessage(serverConvId, { ...userMsg, conversationId: serverConvId });
          saveConversationMeta(slug, conv);
          setActiveConversation(conv);
          setConversations((prev) => [conv, ...prev]);
          // Backfill tempConvId → serverConvId in messages
          setMessages((prev) =>
            prev.map((m) =>
              m.conversationId === tempConvId
                ? { ...m, conversationId: serverConvId }
                : m
            )
          );
        } else {
          saveMessage(serverConvId, userMsg);
          saveConversationMeta(slug, conv);
          setConversations((prev) =>
            prev.map((c) => (c.id === serverConvId ? conv : c))
          );
        }

        // Replace placeholder with final message (has the real ID + any files)
        const assistantMsg: Message = {
          id: response.id,
          role: "assistant",
          content: response.content,
          timestamp: response.timestamp,
          conversationId: serverConvId,
          ...(response.files && response.files.length > 0 ? { files: response.files } : {}),
        };
        setMessages((prev) =>
          prev.map((m) => (m.id === placeholderId ? assistantMsg : m))
        );
        saveMessage(serverConvId, assistantMsg);
      } catch (err) {
        setStreamingId(null);
        resetStreamBuffer();
        abortControllerRef.current = null;
        // If aborted due to unmount, don't show an error — the cleanup effect handles it.
        if (err instanceof DOMException && err.name === "AbortError") return;
        const rawMessage =
          err instanceof Error ? err.message : String(err);
        const friendlyContent = rawMessage.toLowerCase().includes("network") ||
          rawMessage.toLowerCase().includes("failed to fetch")
          ? `Chat failed: network error — check your connection and try again.`
          : `Chat failed: ${rawMessage}`;
        const errorMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: friendlyContent,
          timestamp: new Date().toISOString(),
          conversationId: tempConvId,
        };
        // Replace placeholder with error message
        setMessages((prev) =>
          prev.map((m) => (m.id === placeholderId ? errorMsg : m))
        );
      } finally {
        setIsTyping(false);
      }
    },
    [activeConversation, slug, addChunk, resetStreamBuffer]
  );

  // ---------------------------------------------------------------------------
  // Handle pending prompt (set from empty state)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (pendingPrompt && !isTyping) {
      handleSend(pendingPrompt);
      setPendingPrompt(null);
    }
  }, [pendingPrompt, isTyping, handleSend]);

  // ---------------------------------------------------------------------------
  // Cleanup on unmount: if a stream is active, save a "pending" marker so the
  // next mount knows to re-fetch messages from the server. Also abort the
  // in-flight fetch so we don't leak connections.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      if (streamingIdRef.current && activeConversationIdRef.current) {
        localStorage.setItem(
          `chat:pending-stream:${activeConversationIdRef.current}`,
          Date.now().toString()
        );
      }
      // Abort the in-flight stream fetch if still running.
      abortControllerRef.current?.abort();
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Create new conversation — just reset local state.
  // The server will create the conversation on the next message send.
  // ---------------------------------------------------------------------------
  function handleNewConversation() {
    setActiveConversation(null);
    setMessages([]);
  }

  // ---------------------------------------------------------------------------
  // Delete a conversation — cleans up server + localStorage, resets UI if active
  // ---------------------------------------------------------------------------
  async function handleDeleteConversation(conversationId: string) {
    // Remove from local list immediately (optimistic)
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    deleteLocalConversation(slug, conversationId);

    // If this was the active conversation, reset to empty state
    if (activeConversation?.id === conversationId) {
      setActiveConversation(null);
      setMessages([]);
    }

    // Delete from server (fire-and-forget; UI already updated)
    try {
      await fetch(`/api/conversations/${encodeURIComponent(conversationId)}`, {
        method: "DELETE",
      });
    } catch {
      // Server delete failed — localStorage already cleaned up; tolerate silently
    }
  }

  // ---------------------------------------------------------------------------
  // Select existing conversation
  // Messages are loaded by the activeConversation useEffect above.
  // ---------------------------------------------------------------------------
  function handleSelectConversation(conv: Conversation) {
    setActiveConversation(conv);
  }

  // isTyping: true while we're waiting for the first meta/delta event from server
  // streamingId non-null: we have a placeholder message being filled in live
  const showEmptyState = messages.length === 0 && !isTyping && !streamingId && !conversationsLoading;
  // Show the typing indicator only before any streaming has started
  const showTypingIndicator = isTyping && !streamingId;

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  function handleSelectConversationMobile(conv: Conversation) {
    handleSelectConversation(conv);
    setMobileSidebarOpen(false);
  }

  return (
    <div className="flex overflow-hidden -m-6 lg:-m-8 h-[calc(100vh-56px)] lg:h-screen">
      {/* Conversation sidebar — hidden on mobile, visible at md+ */}
      <div className="hidden md:flex">
        <ConversationSidebar
          conversations={conversations}
          activeConversationId={activeConversation?.id ?? null}
          onSelect={handleSelectConversation}
          onNew={handleNewConversation}
          onDelete={handleDeleteConversation}
          isCreating={false}
        />
      </div>

      {/* Mobile conversation drawer */}
      {mobileSidebarOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/60"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="md:hidden fixed inset-y-0 left-0 z-50 w-64 overflow-hidden flex flex-col">
            <ConversationSidebar
              conversations={conversations}
              activeConversationId={activeConversation?.id ?? null}
              onSelect={handleSelectConversationMobile}
              onNew={() => { handleNewConversation(); setMobileSidebarOpen(false); }}
              onDelete={handleDeleteConversation}
              isCreating={false}
            />
          </div>
        </>
      )}

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0 bg-[var(--bg-0)]">
        {/* Chat header */}
        <header className="flex items-center gap-3 px-4 sm:px-6 py-4 bg-[var(--bg-1)] border-b border-[var(--line-1)] shrink-0">
          {/* Mobile hamburger for conversation list */}
          <button
            className="md:hidden p-1.5 rounded-lg text-[var(--fg-3)] hover:text-[var(--fg-1)] hover:bg-[var(--bg-2)] transition"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open conversations"
          >
            <PanelLeft size={18} />
          </button>
          <Link
            href="/dashboard/team"
            className="p-1.5 rounded-lg text-[var(--fg-3)] hover:text-[var(--fg-1)] hover:bg-[var(--bg-2)] transition"
            aria-label="Back to team"
          >
            <ArrowLeft size={18} />
          </Link>

          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl shrink-0",
              config.bg
            )}
          >
            <Icon size={20} className="text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-[var(--fg-1)] truncate">
              {displayLabel}
            </h1>
            <p className="text-xs text-[var(--fg-3)] truncate">
              {config.description}
            </p>
          </div>

          {/* Active/Off indicator — same source of truth as sidebar */}
          {isEnabled ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-700 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              Off
            </span>
          )}
        </header>

        {/* Messages or empty state */}
        {showEmptyState ? (
          <div className="flex-1 overflow-y-auto">
            <EmptyState slug={archetypeSlug} onPromptSelect={setPendingPrompt} />
          </div>
        ) : (
          <ChatMessages
            messages={messages}
            isTyping={showTypingIndicator}
            streamingId={streamingId}
            streamingContent={streamingDisplayText}
            slug={archetypeSlug}
            onQuickReply={handleSend}
          />
        )}

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          isDisabled={isTyping}
          showPrompts={false}
        />
      </div>
    </div>
  );
}
