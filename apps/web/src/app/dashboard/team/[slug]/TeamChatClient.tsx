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
      <h3 className="mt-4 text-lg font-semibold text-slate-800">
        Start a conversation with your {config.label}
      </h3>
      <p className="mt-1 text-sm text-slate-500 max-w-sm">
        {config.description}. Ask anything — they know your organization.
      </p>

      {prompts.length > 0 && (
        <div className="mt-8 w-full max-w-md">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3">
            Try one of these
          </p>
          <div className="space-y-2">
            {prompts.slice(0, 4).map((prompt, i) => (
              <button
                key={i}
                onClick={() => onPromptSelect(prompt)}
                className="w-full text-left text-sm rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-600 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700 transition group shadow-sm"
              >
                <span className="flex items-start gap-2">
                  <Sparkles
                    size={14}
                    className="shrink-0 mt-0.5 text-slate-300 group-hover:text-brand-400 transition"
                  />
                  {prompt}
                </span>
              </button>
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

  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Load conversations on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // Load local conversations first (instant)
    const local = getLocalConversations(slug);
    setConversations(local);

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
      })
      .catch(() => {
        // Keep local if API fails
      });
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
  // Handle sending a message
  // ---------------------------------------------------------------------------
  const handleSend = useCallback(
    async (content: string) => {
      setIsTyping(true);

      // Add user message to UI immediately. We use a temp conversationId if
      // there is no active conversation yet — the server will assign a real one
      // and we'll backfill localStorage under the server's ID after the response.
      const tempConvId = activeConversation?.id ?? `temp-${crypto.randomUUID()}`;
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: new Date().toISOString(),
        conversationId: tempConvId,
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        // Pass conversationId only when we already have a server-confirmed one.
        const response = await apiSendMessage(
          slug,
          content,
          activeConversation?.id
        );

        // The server is authoritative on conversationId — adopt it now.
        const serverConvId = response.conversationId;

        // Hydrate or update activeConversation from the server's ID.
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

        // If this was a new conversation, save user message under the real ID.
        if (isNew) {
          saveMessage(serverConvId, { ...userMsg, conversationId: serverConvId });
          saveConversationMeta(slug, conv);
          setActiveConversation(conv);
          setConversations((prev) => [conv, ...prev]);
          // Update UI messages to use the real conversationId
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

        const assistantMsg: Message = {
          id: response.id,
          role: "assistant",
          content: response.content,
          timestamp: response.timestamp,
          conversationId: serverConvId,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        saveMessage(serverConvId, assistantMsg);
      } catch (err) {
        const rawMessage =
          err instanceof Error ? err.message : String(err);
        // Surface the real error so users know what failed (auth, network, etc.)
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
        setMessages((prev) => [...prev, errorMsg]);
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

  // ---------------------------------------------------------------------------
  // Prompt from empty state — queue it to send
  // ---------------------------------------------------------------------------
  function handlePromptSelect(prompt: string) {
    setPendingPrompt(prompt);
  }

  const showEmptyState = messages.length === 0 && !isTyping;

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
      <div className="flex flex-col flex-1 min-w-0 bg-slate-50">
        {/* Chat header */}
        <header className="flex items-center gap-3 px-4 sm:px-6 py-4 bg-white border-b border-slate-200 shrink-0">
          <Link
            href="/dashboard/team"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
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
            <h1 className="text-sm font-semibold text-slate-900 truncate">
              {config.label}
            </h1>
            <p className="text-xs text-slate-500 truncate">
              {config.description}
            </p>
          </div>

          {/* Active indicator */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        </header>

        {/* Messages or empty state */}
        {showEmptyState ? (
          <div className="flex-1 overflow-y-auto">
            <EmptyState slug={archetypeSlug} onPromptSelect={handlePromptSelect} />
          </div>
        ) : (
          <ChatMessages
            messages={messages}
            isTyping={isTyping}
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
