"use client";

import { useState, useEffect, useCallback } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
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
  saveMessage,
  saveConversationMeta,
  getLocalConversations,
  generateTitle,
  type Message,
  type Conversation,
} from "./api";
import { cn } from "@/lib/utils";
import { useArchetypeNames } from "@/hooks/useArchetypeNames";
import { SuggestionChip } from "@/components/ui";

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
        <div className="mt-8 w-full max-w-md">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--fg-3)] mb-3">
            Try one of these
          </p>
          <div className="flex flex-col items-center gap-2">
            {prompts.slice(0, 4).map((prompt, i) => (
              <SuggestionChip
                key={i}
                icon={<Sparkles size={14} />}
                onClick={() => onPromptSelect(prompt)}
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

  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  // streamingId: ID of the assistant message currently being streamed in.
  // The UI uses this to find-and-update the partial message in place.
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Load conversations on mount — auto-select the most recent one
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // Load local conversations first (instant)
    const local = getLocalConversations(slug);
    setConversations(local);

    // Auto-select most recent local conversation immediately (instant UX)
    if (local.length > 0 && !activeConversation) {
      const mostRecent = local[0]; // getLocalConversations returns newest first
      setActiveConversation(mostRecent);
      setMessages(getMessages(mostRecent.id));
    }

    // Then fetch from API
    getConversations(slug)
      .then((remote) => {
        // Merge: local first (most recent activity), then remote
        const remoteIds = new Set(remote.map((c) => c.id));
        const merged = [
          ...local.filter((c) => !remoteIds.has(c.id)),
          ...remote,
        ];
        setConversations(merged);

        // If no local conversations existed, auto-select most recent from remote
        if (local.length === 0 && merged.length > 0 && !activeConversation) {
          const mostRecent = merged[0];
          setActiveConversation(mostRecent);
          setMessages(getMessages(mostRecent.id));
        }
      })
      .catch(() => {
        // Keep local if API fails
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // ---------------------------------------------------------------------------
  // Load messages for active conversation
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (activeConversation) {
      const stored = getMessages(activeConversation.id);
      setMessages(stored);
    } else {
      setMessages([]);
    }
  }, [activeConversation]);

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

        const response = await apiSendMessage(
          slug,
          content,
          activeConversation?.id,
          // onDelta: append each chunk to the placeholder message in real time
          (chunk: string) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === placeholderId
                  ? { ...m, content: m.content + chunk }
                  : m
              )
            );
          }
        );

        setStreamingId(null);

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
    [activeConversation, slug]
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
  // Create new conversation — just reset local state.
  // The server will create the conversation on the next message send.
  // ---------------------------------------------------------------------------
  function handleNewConversation() {
    setActiveConversation(null);
    setMessages([]);
  }

  // ---------------------------------------------------------------------------
  // Select existing conversation
  // ---------------------------------------------------------------------------
  function handleSelectConversation(conv: Conversation) {
    setActiveConversation(conv);
    const stored = getMessages(conv.id);
    setMessages(stored);
  }

  // isTyping: true while we're waiting for the first meta/delta event from server
  // streamingId non-null: we have a placeholder message being filled in live
  const showEmptyState = messages.length === 0 && !isTyping && !streamingId;
  // Show the typing indicator only before any streaming has started
  const showTypingIndicator = isTyping && !streamingId;

  return (
    <div className="flex overflow-hidden -m-6 lg:-m-8" style={{ height: "calc(100vh)" }}>
      {/* Conversation sidebar */}
      <ConversationSidebar
        conversations={conversations}
        activeConversationId={activeConversation?.id ?? null}
        onSelect={handleSelectConversation}
        onNew={handleNewConversation}
        isCreating={false}
      />

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0 bg-[var(--bg-0)]">
        {/* Chat header */}
        <header className="flex items-center gap-3 px-4 sm:px-6 py-4 bg-[var(--bg-1)] border-b border-[var(--line-1)] shrink-0">
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

          {/* Active indicator */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 text-xs font-medium text-emerald-400 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
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
            slug={archetypeSlug}
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
