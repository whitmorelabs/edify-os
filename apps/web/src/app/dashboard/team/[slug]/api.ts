// Types for the team chat system

/** A skill-generated file returned with an assistant message. */
export interface GeneratedFile {
  /** Original filename (e.g. "grant-proposal.docx") */
  name: string;
  /** MIME type (e.g. "application/vnd.openxmlformats-officedocument.wordprocessingml.document") */
  mimeType: string;
  /** URL for the proxy download route (/api/files/:fileId) */
  downloadUrl: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string; // ISO 8601
  conversationId?: string;
  /** Skill-generated files attached to this message (assistant messages only). */
  files?: GeneratedFile[];
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
  /** Skill-generated files produced during this response. */
  files?: GeneratedFile[];
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/**
 * Send a message to a team member and stream their response.
 * POSTs to the server-side /api/team/[slug]/chat route which uses the
 * encrypted API key from Supabase (set during onboarding) and runs the
 * full Phase 2b/2c tool-use loop (Calendar, Gmail, Grants, CRM).
 *
 * The server returns an SSE stream with three event types:
 *   { type: "meta", id, conversationId, timestamp, files? }
 *   { type: "delta", text }
 *   { type: "done" }
 *
 * onDelta is called for each text chunk so the UI can render progressively.
 * Returns the fully assembled AssistantMessage when the stream closes.
 */
export async function sendMessage(
  slug: string,
  message: string,
  conversationId?: string,
  onDelta?: (chunk: string) => void,
  signal?: AbortSignal
): Promise<AssistantMessage> {
  const res = await fetch(`/api/team/${slug}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, conversationId }),
    signal,
  });

  if (!res.ok) {
    let serverMsg = "Server error";
    try {
      const data = await res.json();
      if (data?.error) serverMsg = data.error;
    } catch { /* ignore parse */ }
    throw new Error(`${res.status}: ${serverMsg}`);
  }

  // Check if the server returned an SSE stream or a plain JSON response.
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("text/event-stream")) {
    // Fallback: plain JSON (should not happen in normal operation).
    const data = await res.json();
    return {
      id: data.id,
      role: "assistant",
      content: data.content,
      timestamp: data.timestamp,
      conversationId: data.conversationId,
      ...(data.files && data.files.length > 0 ? { files: data.files as GeneratedFile[] } : {}),
    };
  }

  // Parse the SSE stream.
  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";
  let meta: { id: string; conversationId: string; timestamp: string; files?: GeneratedFile[] } | null = null;
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? ""; // Keep incomplete last line in buffer

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (!raw) continue;

      try {
        const event = JSON.parse(raw) as {
          type: string;
          id?: string;
          conversationId?: string;
          timestamp?: string;
          files?: GeneratedFile[];
          text?: string;
        };

        if (event.type === "meta") {
          meta = {
            id: event.id!,
            conversationId: event.conversationId!,
            timestamp: event.timestamp!,
            files: event.files,
          };
        } else if (event.type === "delta" && event.text) {
          fullText += event.text;
          onDelta?.(event.text);
        }
        // "done" event — loop will end naturally when the stream closes
      } catch {
        // Ignore malformed SSE lines
      }
    }
  }

  if (!meta) {
    throw new Error("Stream ended without meta event");
  }

  return {
    id: meta.id,
    role: "assistant",
    content: fullText,
    timestamp: meta.timestamp,
    conversationId: meta.conversationId,
    ...(meta.files && meta.files.length > 0 ? { files: meta.files } : {}),
  };
}

/**
 * Fetch conversation list for a team member from the server.
 * Falls back to local conversations if the server request fails.
 */
export async function getConversations(slug: string): Promise<Conversation[]> {
  try {
    const res = await fetch(`/api/team/${slug}/conversations`);
    if (!res.ok) return getLocalConversations(slug);
    const data = (await res.json()) as Array<{
      id: string;
      title: string;
      created_at: string;
      updated_at: string;
    }>;
    return data.map((c) => ({
      id: c.id,
      slug,
      title: c.title ?? "Untitled conversation",
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      messageCount: 0,
    }));
  } catch {
    return getLocalConversations(slug);
  }
}

/**
 * Load messages for a conversation from the server.
 * Returns an empty array if the server request fails (caller falls back to localStorage).
 */
export async function getMessagesFromServer(
  slug: string,
  conversationId: string
): Promise<Message[]> {
  try {
    const res = await fetch(
      `/api/team/${slug}/messages?conversationId=${encodeURIComponent(conversationId)}`
    );
    if (!res.ok) return [];
    return (await res.json()) as Message[];
  } catch {
    return [];
  }
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
 * Remove a conversation from localStorage (client-side cleanup after server delete).
 */
export function deleteLocalConversation(slug: string, conversationId: string): void {
  if (typeof window === "undefined") return;

  try {
    const key = `chat:conversations:${slug}`;
    const raw = localStorage.getItem(key);
    const existing: Conversation[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(key, JSON.stringify(existing.filter((c) => c.id !== conversationId)));
    localStorage.removeItem(`chat:messages:${conversationId}`);
  } catch {
    // ignore
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
