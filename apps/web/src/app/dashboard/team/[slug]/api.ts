// Types for the team chat system
import { getApiKey } from "@/lib/api-key";
import { getOrgContext } from "@/lib/org-context";
import { getSystemPrompt } from "@/lib/archetype-prompts";
import { callClaude, type ClaudeMessage } from "@/lib/claude-client";
import { getMessages as getStoredMessages } from "@/lib/conversations";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string; // ISO 8601
  conversationId?: string;
}

export interface Conversation {
  id: string;
  slug: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface AssistantMessage {
  id: string;
  role: "assistant";
  content: string;
  timestamp: string;
  conversationId: string;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/**
 * Send a message to a team member and get their response.
 * Calls Claude API directly from the browser using the user's BYOK key.
 */
export async function sendMessage(
  slug: string,
  message: string,
  conversationId?: string
): Promise<AssistantMessage> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("No API key set. Please add your Claude API key in AI Configuration.");
  }

  const orgContext = getOrgContext();
  const systemPrompt = getSystemPrompt(slug, orgContext);

  // Build conversation history for context
  const historyMessages: ClaudeMessage[] = [];
  if (conversationId) {
    const stored = getStoredMessages(conversationId);
    for (const msg of stored) {
      historyMessages.push({ role: msg.role, content: msg.content });
    }
  }

  // Add the new user message
  historyMessages.push({ role: "user", content: message });

  const response = await callClaude(apiKey, systemPrompt, historyMessages, {
    maxTokens: 4096,
    temperature: 0.3,
  });

  return {
    id: response.id,
    role: "assistant",
    content: response.content,
    timestamp: response.timestamp,
    conversationId: conversationId ?? crypto.randomUUID(),
  };
}

/**
 * Fetch conversation list for a team member.
 * Returns locally-stored conversations (no server needed).
 */
export async function getConversations(slug: string): Promise<Conversation[]> {
  return getLocalConversations(slug);
}

/**
 * Get all messages for a conversation (from localStorage).
 */
export function getMessages(conversationId: string): Message[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(`chat:messages:${conversationId}`);
    if (!raw) return [];
    return JSON.parse(raw) as Message[];
  } catch {
    return [];
  }
}

/**
 * Persist a message to localStorage for a conversation.
 */
export function saveMessage(conversationId: string, message: Message): void {
  if (typeof window === "undefined") return;

  try {
    const existing = getMessages(conversationId);
    const updated = [...existing, message];
    localStorage.setItem(
      `chat:messages:${conversationId}`,
      JSON.stringify(updated)
    );
  } catch {
    // localStorage quota exceeded — degrade gracefully
  }
}

/**
 * Save the conversation title (auto-generated from first message).
 */
export function saveConversationMeta(
  slug: string,
  conversation: Conversation
): void {
  if (typeof window === "undefined") return;

  try {
    const key = `chat:conversations:${slug}`;
    const raw = localStorage.getItem(key);
    const existing: Conversation[] = raw ? JSON.parse(raw) : [];

    const idx = existing.findIndex((c) => c.id === conversation.id);
    if (idx >= 0) {
      existing[idx] = conversation;
    } else {
      existing.unshift(conversation);
    }

    localStorage.setItem(key, JSON.stringify(existing));
  } catch {
    // ignore
  }
}

/**
 * Get locally-stored conversations for a team member.
 */
export function getLocalConversations(slug: string): Conversation[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(`chat:conversations:${slug}`);
    return raw ? (JSON.parse(raw) as Conversation[]) : [];
  } catch {
    return [];
  }
}

/**
 * Create a new conversation locally (no server needed).
 */
export async function createConversation(slug: string): Promise<Conversation> {
  const conv: Conversation = {
    id: crypto.randomUUID(),
    slug,
    title: "New conversation",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messageCount: 0,
  };
  saveConversationMeta(slug, conv);
  return conv;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generates a conversation title from the first user message.
 * Trims to ~60 chars and adds ellipsis if needed.
 */
export function generateTitle(firstMessage: string): string {
  const trimmed = firstMessage.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 60) return trimmed;
  return trimmed.slice(0, 57) + "...";
}
