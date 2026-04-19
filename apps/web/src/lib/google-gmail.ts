/**
 * Typed REST wrappers for Gmail v1 API.
 * Uses direct fetch — no googleapis SDK (same pattern as google-calendar.ts).
 * All functions accept a decrypted accessToken string (obtained via getValidGoogleAccessToken).
 *
 * Integration type: "gmail" (matches GOOGLE_INTEGRATION_TYPES in lib/google.ts).
 */

import { handleJsonResponse } from "@/lib/http";

const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

// ---------------------------------------------------------------------------
// Types — slim shapes surfaced to Claude
// ---------------------------------------------------------------------------

export type GmailMessage = {
  id: string;
  threadId: string;
  snippet?: string;
  from?: string;
  subject?: string;
  date?: string;
  isUnread?: boolean;
  body?: string; // only populated by getMessage (full fetch)
  messageId?: string; // raw Message-ID header, used for reply threading
};

export type GmailThread = {
  id: string;
  snippet?: string;
  messages?: GmailMessage[];
};

export type GmailDraft = {
  id: string;
  message: {
    id: string;
    threadId: string;
  };
};

export type GmailLabel = {
  id: string;
  name: string;
  type?: string; // "system" | "user"
};

// ---------------------------------------------------------------------------
// Error class — mirrors GoogleCalendarError shape exactly
// ---------------------------------------------------------------------------

export class GmailError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "GmailError";
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function authHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  return handleJsonResponse<T>(response, {
    extractMessage: (body) => {
      const b = body as Record<string, unknown> | null;
      const err = b?.error as Record<string, unknown> | undefined;
      return typeof err?.message === "string" ? err.message : undefined;
    },
    makeError: (status, msg) => new GmailError(status, msg),
  });
}

/**
 * Encode a string as base64url (Gmail's variant: + → -, / → _, strip = padding).
 * Used for RFC 2822 MIME message encoding required by Gmail v1 send/draft endpoints.
 */
function toBase64Url(input: string): string {
  // btoa works in both Node 18+ and browser environments
  return btoa(
    encodeURIComponent(input).replace(/%([0-9A-F]{2})/g, (_match, p1: string) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Build an RFC 2822 MIME message and base64url-encode it for Gmail.
 * Handles optional threading headers (In-Reply-To, References).
 */
function buildEncodedMime({
  to,
  subject,
  body,
  cc,
  bcc,
  inReplyTo,
}: {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  inReplyTo?: string;
}): string {
  const lines: string[] = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
  ];
  if (cc) lines.push(`Cc: ${cc}`);
  if (bcc) lines.push(`Bcc: ${bcc}`);
  if (inReplyTo) {
    lines.push(`In-Reply-To: ${inReplyTo}`);
    lines.push(`References: ${inReplyTo}`);
  }
  lines.push(""); // blank line separates headers from body
  lines.push(body);
  return toBase64Url(lines.join("\r\n"));
}

/**
 * Parse slim GmailMessage fields from the raw Gmail API message resource.
 * Extracts From, Subject, Date from headers; checks UNREAD label.
 */
function parseMessage(
  raw: Record<string, unknown>,
  fullBody = false
): GmailMessage {
  const id = raw.id as string;
  const threadId = raw.threadId as string;
  const snippet = raw.snippet as string | undefined;
  const labelIds = (raw.labelIds as string[] | undefined) ?? [];
  const isUnread = labelIds.includes("UNREAD");

  const headers =
    ((raw.payload as Record<string, unknown> | undefined)
      ?.headers as Array<{ name: string; value: string }>) ?? [];

  const getHeader = (name: string): string | undefined =>
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value;

  const msg: GmailMessage = {
    id,
    threadId,
    snippet,
    from: getHeader("From"),
    subject: getHeader("Subject"),
    date: getHeader("Date"),
    isUnread,
  };

  // Capture raw Message-ID for reply threading
  const rawMessageId = getHeader("Message-ID");
  if (rawMessageId) msg.messageId = rawMessageId;

  if (fullBody) {
    const body = extractBody(raw.payload as Record<string, unknown> | undefined);
    msg.body = body;
  }

  return msg;
}

/**
 * Recursively extract plain-text body from the Gmail payload (handles multipart).
 * Truncates at 8000 chars.
 */
function extractBody(
  payload: Record<string, unknown> | undefined
): string | undefined {
  if (!payload) return undefined;

  const mimeType = payload.mimeType as string | undefined;

  // If this part is plain text, decode and return it
  if (mimeType === "text/plain") {
    const dataStr = (payload.body as Record<string, unknown> | undefined)
      ?.data as string | undefined;
    if (!dataStr) return undefined;
    // Gmail returns base64url; decode to UTF-8 text
    const decoded = decodeBase64Url(dataStr);
    return decoded.length > 8000
      ? decoded.slice(0, 8000) + "[...truncated]"
      : decoded;
  }

  // For multipart, recurse into parts
  if (mimeType?.startsWith("multipart/")) {
    const parts =
      (payload.parts as Array<Record<string, unknown>> | undefined) ?? [];
    for (const part of parts) {
      const text = extractBody(part);
      if (text) return text;
    }
  }

  return undefined;
}

/**
 * Decode a base64url string to a UTF-8 string.
 */
function decodeBase64Url(base64url: string): string {
  // Convert base64url back to standard base64
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  // Pad to 4-char boundary
  const padded = base64 + "===".slice((base64.length + 3) % 4);
  return atob(padded);
}

// ---------------------------------------------------------------------------
// Gmail API functions
// ---------------------------------------------------------------------------

/**
 * List messages (slim projection). Supports Gmail search query syntax.
 * Defaults to 20 results.
 */
export async function listMessages({
  accessToken,
  query,
  labelIds,
  maxResults = 20,
}: {
  accessToken: string;
  query?: string;
  labelIds?: string[];
  maxResults?: number;
}): Promise<{ messages: GmailMessage[] }> {
  const params = new URLSearchParams({
    maxResults: String(Math.min(Math.max(1, maxResults), 50)),
    format: "metadata",
  });
  if (query) params.set("q", query);
  if (labelIds?.length) params.set("labelIds", labelIds.join(","));

  const listUrl = `${GMAIL_BASE}/messages?${params}`;
  const listRes = await fetch(listUrl, { headers: authHeaders(accessToken) });
  const listData = await handleResponse<{
    messages?: Array<{ id: string; threadId: string }>;
  }>(listRes);

  const stubs = listData.messages ?? [];
  if (stubs.length === 0) return { messages: [] };

  // Fetch metadata for each stub in parallel (metadata format = slim)
  const metaParams = new URLSearchParams({
    format: "metadata",
    "metadataHeaders": "From",
  });
  // Override: use full metadata fetch per-message for From/Subject/Date headers
  const messages = await Promise.all(
    stubs.map(async ({ id }) => {
      const msgParams = new URLSearchParams({
        format: "metadata",
        "metadataHeaders": "From",
      });
      msgParams.append("metadataHeaders", "Subject");
      msgParams.append("metadataHeaders", "Date");
      const msgUrl = `${GMAIL_BASE}/messages/${encodeURIComponent(id)}?${msgParams}`;
      const msgRes = await fetch(msgUrl, { headers: authHeaders(accessToken) });
      const raw = await handleResponse<Record<string, unknown>>(msgRes);
      return parseMessage(raw, false);
    })
  );
  void metaParams; // suppress unused warning

  return { messages };
}

/**
 * Get a single message with full body parsed.
 */
export async function getMessage({
  accessToken,
  messageId,
}: {
  accessToken: string;
  messageId: string;
}): Promise<{ message: GmailMessage }> {
  const url = `${GMAIL_BASE}/messages/${encodeURIComponent(messageId)}?format=full`;
  const response = await fetch(url, { headers: authHeaders(accessToken) });
  const raw = await handleResponse<Record<string, unknown>>(response);
  return { message: parseMessage(raw, true) };
}

/**
 * List threads (slim). Supports Gmail search query syntax.
 * Defaults to 10 results.
 */
export async function listThreads({
  accessToken,
  query,
  labelIds,
  maxResults = 10,
}: {
  accessToken: string;
  query?: string;
  labelIds?: string[];
  maxResults?: number;
}): Promise<{ threads: GmailThread[] }> {
  const params = new URLSearchParams({
    maxResults: String(Math.min(Math.max(1, maxResults), 50)),
  });
  if (query) params.set("q", query);
  if (labelIds?.length) params.set("labelIds", labelIds.join(","));

  const url = `${GMAIL_BASE}/threads?${params}`;
  const response = await fetch(url, { headers: authHeaders(accessToken) });
  const data = await handleResponse<{
    threads?: Array<{ id: string; snippet?: string }>;
  }>(response);

  const threads: GmailThread[] = (data.threads ?? []).map((t) => ({
    id: t.id,
    snippet: t.snippet,
  }));

  return { threads };
}

/**
 * Get a thread with all messages (slim projection per message).
 */
export async function getThread({
  accessToken,
  threadId,
}: {
  accessToken: string;
  threadId: string;
}): Promise<{ thread: GmailThread }> {
  const url = `${GMAIL_BASE}/threads/${encodeURIComponent(threadId)}?format=metadata`;
  const response = await fetch(url, { headers: authHeaders(accessToken) });
  const raw = await handleResponse<{
    id: string;
    snippet?: string;
    messages?: Array<Record<string, unknown>>;
  }>(response);

  const thread: GmailThread = {
    id: raw.id,
    snippet: raw.snippet,
    messages: (raw.messages ?? []).map((m) => parseMessage(m, false)),
  };

  return { thread };
}

/**
 * Create a Gmail draft (does NOT send).
 */
export async function createDraft({
  accessToken,
  to,
  subject,
  body,
  cc,
  bcc,
  threadId,
  inReplyTo,
}: {
  accessToken: string;
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  threadId?: string;
  inReplyTo?: string;
}): Promise<{ draft: GmailDraft }> {
  const raw = buildEncodedMime({ to, subject, body, cc, bcc, inReplyTo });

  const messageResource: Record<string, unknown> = { raw };
  if (threadId) messageResource.threadId = threadId;

  const url = `${GMAIL_BASE}/drafts`;
  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify({ message: messageResource }),
  });
  const data = await handleResponse<{
    id: string;
    message: { id: string; threadId: string };
  }>(response);

  return {
    draft: {
      id: data.id,
      message: { id: data.message.id, threadId: data.message.threadId },
    },
  };
}

/**
 * Send a message immediately. Prefer createDraft unless user explicitly confirmed send.
 */
export async function sendMessage({
  accessToken,
  to,
  subject,
  body,
  cc,
  bcc,
  threadId,
  inReplyTo,
}: {
  accessToken: string;
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  threadId?: string;
  inReplyTo?: string;
}): Promise<{ message: GmailMessage }> {
  const raw = buildEncodedMime({ to, subject, body, cc, bcc, inReplyTo });

  const messageResource: Record<string, unknown> = { raw };
  if (threadId) messageResource.threadId = threadId;

  const url = `${GMAIL_BASE}/messages/send`;
  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify(messageResource),
  });
  const data = await handleResponse<Record<string, unknown>>(response);
  return { message: parseMessage(data, false) };
}

/**
 * Add or remove labels on a message.
 */
export async function modifyLabels({
  accessToken,
  messageId,
  addLabelIds,
  removeLabelIds,
}: {
  accessToken: string;
  messageId: string;
  addLabelIds?: string[];
  removeLabelIds?: string[];
}): Promise<{ message: GmailMessage }> {
  const url = `${GMAIL_BASE}/messages/${encodeURIComponent(messageId)}/modify`;
  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify({
      addLabelIds: addLabelIds ?? [],
      removeLabelIds: removeLabelIds ?? [],
    }),
  });
  const raw = await handleResponse<Record<string, unknown>>(response);
  return { message: parseMessage(raw, false) };
}

/**
 * List all labels for the authenticated user.
 */
export async function listLabels({
  accessToken,
}: {
  accessToken: string;
}): Promise<{ labels: GmailLabel[] }> {
  const url = `${GMAIL_BASE}/labels`;
  const response = await fetch(url, { headers: authHeaders(accessToken) });
  const data = await handleResponse<{
    labels?: Array<{ id: string; name: string; type?: string }>;
  }>(response);

  return {
    labels: (data.labels ?? []).map((l) => ({
      id: l.id,
      name: l.name,
      type: l.type,
    })),
  };
}
