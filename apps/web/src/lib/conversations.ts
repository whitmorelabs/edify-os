// Conversation persistence for team chat using localStorage.
// Each archetype gets its own conversation history keyed by slug + conversation ID.

export interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  conversationId: string;
}

export interface StoredConversation {
  id: string;
  slug: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

function conversationListKey(slug: string): string {
  return `edify-conversations-${slug}`;
}

function messageKey(conversationId: string): string {
  return `chat:messages:${conversationId}`;
}

/**
 * Get all conversations for a given archetype slug.
 */
export function getConversations(slug: string): StoredConversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(conversationListKey(slug));
    return raw ? (JSON.parse(raw) as StoredConversation[]) : [];
  } catch {
    return [];
  }
}

/**
 * Save a conversation to the list for a slug.
 * Updates if existing, inserts at front if new.
 */
export function saveConversation(
  slug: string,
  conversation: StoredConversation
): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getConversations(slug);
    const idx = existing.findIndex((c) => c.id === conversation.id);
    if (idx >= 0) {
      existing[idx] = conversation;
    } else {
      existing.unshift(conversation);
    }
    localStorage.setItem(conversationListKey(slug), JSON.stringify(existing));
  } catch {
    // ignore quota errors
  }
}

/**
 * Delete a conversation and its messages.
 */
export function deleteConversation(slug: string, conversationId: string): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getConversations(slug).filter(
      (c) => c.id !== conversationId
    );
    localStorage.setItem(conversationListKey(slug), JSON.stringify(existing));
    localStorage.removeItem(messageKey(conversationId));
  } catch {
    // ignore
  }
}

/**
 * Get all messages for a conversation.
 */
export function getMessages(conversationId: string): StoredMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(messageKey(conversationId));
    return raw ? (JSON.parse(raw) as StoredMessage[]) : [];
  } catch {
    return [];
  }
}

/**
 * Append a single message to a conversation.
 */
export function saveMessage(
  conversationId: string,
  message: StoredMessage
): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getMessages(conversationId);
    existing.push(message);
    localStorage.setItem(messageKey(conversationId), JSON.stringify(existing));
  } catch {
    // ignore quota errors
  }
}

/**
 * Clear all messages for a conversation (keeps the conversation entry).
 */
export function clearConversation(conversationId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(messageKey(conversationId));
  } catch {
    // ignore
  }
}

/**
 * List conversation IDs for a slug (just IDs for quick lookup).
 */
export function listConversations(slug: string): string[] {
  return getConversations(slug).map((c) => c.id);
}
