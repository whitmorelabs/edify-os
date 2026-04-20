// Types for the team chat system

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
 * POSTs to the server-side /api/team/[slug]/chat route which uses the
 * encrypted API key from Supabase (set during onboarding) and runs the
 * full Phase 2b/2c tool-use loop (Calendar, Gmail, Grants, CRM).
 */
export async function sendMessage(
  slug: string,
  message: string,
  conversationId?: string
): Promise<AssistantMessage> {
  const res = await fetch(`/api/team/${slug}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, conversationId }),
  });

  if (!res.ok) {
    let serverMsg = "Server error";
    try {
      const data = await res.json();
      if (data?.error) serverMsg = data.error;
    } catch { /* ignore parse */ }
    throw new Error(`${res.status}: ${serverMsg}`);
  }

  const data = await res.json();
  return {
    id: data.id,
    role: "assistant",
    content: data.content,
    timestamp: data.timestamp,
    conversationId: data.conversationId,
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
