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
  createConversation,
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
    "What grant deadlines are coming up this month?",
    "Help me draft talking points for a major donor meeting",
    "Review our fundraising pipeline and flag any gaps",
    "Write an LOI for a youth services grant",
    "How can we improve our donor retention rate?",
  ],
  marketing_director: [
    "Draft a press release for our spring campaign",
    "What should we post on social media this week?",
    "Analyze our email open rates and suggest improvements",
    "Create a content calendar for next month",
    "How do we grow our newsletter subscriber list?",
  ],
  executive_assistant: [
    "What's on my schedule that needs attention this week?",
    "Help me prep for tomorrow's board meeting",
    "Triage my inbox and flag urgent messages",
    "Schedule the team planning session for next month",
    "Draft a follow-up email to the venue coordinator",
  ],
  programs_director: [
    "How are our programs tracking against Q2 targets?",
    "What compliance deadlines do I need to know about?",
    "Help me write the quarterly outcome report",
    "What's the waitlist situation for summer programs?",
    "Draft a program expansion proposal for the board",
  ],
  hr_volunteer_coordinator: [
    "Who needs to renew their certifications soon?",
    "Help me write job postings for open coordinator roles",
    "What does the staff pulse survey tell us?",
    "Draft a volunteer onboarding checklist",
    "How can we improve volunteer retention?",
  ],
  events_director: [
    "What's the status of the May gala planning?",
    "Which sponsors haven't responded to our outreach?",
    "Help me fill the volunteer roles for the event",
    "Draft the event program booklet outline",
    "What post-event follow-ups still need to happen?",
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
  const [isCreatingConv, setIsCreatingConv] = useState(false);
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
  // Handle pending prompt (set from empty state)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (pendingPrompt && !isTyping) {
      handleSend(pendingPrompt);
      setPendingPrompt(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPrompt]);

  // ---------------------------------------------------------------------------
  // Handle sending a message
  // ---------------------------------------------------------------------------
  const handleSend = useCallback(
    async (content: string) => {
      setIsTyping(true);

      // Create a conversation if none is active
      let conv = activeConversation;
      if (!conv) {
        const title = generateTitle(content);
        try {
          conv = await createConversation(slug);
          conv = { ...conv, title };
          saveConversationMeta(slug, conv);
          setActiveConversation(conv);
          setConversations((prev) => [conv!, ...prev]);
        } catch {
          // Create a local-only conversation
          conv = {
            id: crypto.randomUUID(),
            slug,
            title: generateTitle(content),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messageCount: 0,
          };
          saveConversationMeta(slug, conv);
          setActiveConversation(conv);
          setConversations((prev) => [conv!, ...prev]);
        }
      }

      // Add user message to UI immediately
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: new Date().toISOString(),
        conversationId: conv.id,
      };
      setMessages((prev) => [...prev, userMsg]);
      saveMessage(conv.id, userMsg);

      // Update conversation title from first message
      if (conv.messageCount === 0) {
        const updated = { ...conv, title: generateTitle(content) };
        saveConversationMeta(slug, updated);
        setConversations((prev) =>
          prev.map((c) => (c.id === conv!.id ? updated : c))
        );
      }

      try {
        const response = await apiSendMessage(slug, content, conv.id);
        const assistantMsg: Message = {
          id: response.id,
          role: "assistant",
          content: response.content,
          timestamp: response.timestamp,
          conversationId: conv.id,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        saveMessage(conv.id, assistantMsg);

        // Update conversation metadata
        const updatedConv: Conversation = {
          ...conv,
          updatedAt: new Date().toISOString(),
          messageCount: conv.messageCount + 2,
        };
        saveConversationMeta(slug, updatedConv);
        setConversations((prev) =>
          prev.map((c) => (c.id === conv!.id ? updatedConv : c))
        );
      } catch {
        const errorMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "I'm having trouble connecting right now. Please try again in a moment.",
          timestamp: new Date().toISOString(),
          conversationId: conv.id,
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsTyping(false);
      }
    },
    [activeConversation, slug]
  );

  // ---------------------------------------------------------------------------
  // Create new conversation
  // ---------------------------------------------------------------------------
  async function handleNewConversation() {
    setIsCreatingConv(true);
    try {
      const conv = await createConversation(slug);
      setActiveConversation(conv);
      setMessages([]);
      setConversations((prev) => [conv, ...prev]);
    } catch {
      // Create locally
      const conv: Conversation = {
        id: crypto.randomUUID(),
        slug,
        title: "New conversation",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messageCount: 0,
      };
      saveConversationMeta(slug, conv);
      setActiveConversation(conv);
      setMessages([]);
      setConversations((prev) => [conv, ...prev]);
    } finally {
      setIsCreatingConv(false);
    }
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

  const suggestedPrompts = SUGGESTED_PROMPTS[slug] ?? [];
  const showEmptyState = messages.length === 0 && !isTyping;

  return (
    <div className="flex overflow-hidden -m-6 lg:-m-8" style={{ height: "calc(100vh)" }}>
      {/* Conversation sidebar */}
      <ConversationSidebar
        conversations={conversations}
        activeConversationId={activeConversation?.id ?? null}
        onSelect={handleSelectConversation}
        onNew={handleNewConversation}
        isCreating={isCreatingConv}
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
          suggestedPrompts={suggestedPrompts}
          showPrompts={false}
        />
      </div>
    </div>
  );
}
