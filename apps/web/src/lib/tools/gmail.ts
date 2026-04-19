/**
 * Anthropic tool definitions and executor for Gmail.
 * Eight tools: gmail_list_messages, gmail_get_message, gmail_list_threads,
 * gmail_get_thread, gmail_create_draft, gmail_send_message,
 * gmail_modify_labels, gmail_list_labels.
 *
 * Tool descriptions are written as model-facing prompt engineering.
 * Layout mirrors calendar.ts almost exactly — deviations only for Gmail-specific
 * concerns (MIME, slim projection shapes, send-gate addendum).
 */

import type Anthropic from "@anthropic-ai/sdk";
import {
  listMessages,
  getMessage,
  listThreads,
  getThread,
  createDraft,
  sendMessage,
  modifyLabels,
  listLabels,
  GmailError,
} from "@/lib/google-gmail";

// ---------------------------------------------------------------------------
// System-prompt addendum for archetypes that have Gmail tools active.
// Kept here so it stays co-located with the tool definitions it describes.
// ---------------------------------------------------------------------------

export const GMAIL_TOOLS_ADDENDUM = `\nYou have access to the user's Gmail via tools. Prefer gmail_create_draft over gmail_send_message unless the user explicitly asks you to send immediately — drafts let the user review before sending. Never fabricate email content; always call gmail_list_messages or gmail_get_message to see what's actually there. When replying, use threadId and inReplyTo so Gmail threads the response correctly.`;

// ---------------------------------------------------------------------------
// Tool definitions (model-facing)
// ---------------------------------------------------------------------------

export const gmailTools: Anthropic.Tool[] = [
  {
    name: "gmail_list_messages",
    description:
      "List messages from the user's Gmail inbox (slim view: id, threadId, snippet, from, subject, date, isUnread). Use when the user asks what's in their inbox, unread emails, emails from a specific sender, etc. Supports Gmail search syntax via the query parameter (e.g. 'from:donor@example.org is:unread', 'subject:gala', 'after:2026-04-01'). Always call this before claiming the inbox is empty.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description:
            "Gmail search query (e.g. 'is:unread', 'from:donor@example.org', 'subject:grant'). Omit for all recent messages.",
        },
        labelIds: {
          type: "array",
          description:
            "Filter to messages with these label IDs (e.g. ['INBOX', 'UNREAD']). Optional.",
          items: { type: "string" },
        },
        maxResults: {
          type: "number",
          description: "Max messages to return (1–50). Defaults to 20.",
        },
      },
      required: [],
    },
  },
  {
    name: "gmail_get_message",
    description:
      "Fetch full details of a single Gmail message by its ID, including the full text body (up to 8000 chars). Use after gmail_list_messages when the user wants to read a specific message. Also returns the raw Message-ID header — use this as inReplyTo when drafting a threaded reply. Do not guess message IDs.",
    input_schema: {
      type: "object" as const,
      properties: {
        messageId: {
          type: "string",
          description: "The Gmail message ID from a prior gmail_list_messages call.",
        },
      },
      required: ["messageId"],
    },
  },
  {
    name: "gmail_list_threads",
    description:
      "List email threads (conversations) in Gmail. Returns thread IDs and snippets. Use when the user asks about email conversations or multi-message exchanges with a person — threads give a summary view without fetching every message. Supports the same Gmail search syntax as gmail_list_messages. Defaults to 10 threads.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description:
            "Gmail search query (e.g. 'from:donor@example.org', 'subject:annual gala'). Optional.",
        },
        labelIds: {
          type: "array",
          description:
            "Filter to threads with these label IDs. Optional.",
          items: { type: "string" },
        },
        maxResults: {
          type: "number",
          description: "Max threads to return (1–50). Defaults to 10.",
        },
      },
      required: [],
    },
  },
  {
    name: "gmail_get_thread",
    description:
      "Fetch all messages in a Gmail thread (slim view per message). Use after gmail_list_threads to read a full conversation without calling gmail_get_message N times. Returns each message's from, subject, date, snippet, and isUnread status.",
    input_schema: {
      type: "object" as const,
      properties: {
        threadId: {
          type: "string",
          description: "The Gmail thread ID from a prior gmail_list_threads call.",
        },
      },
      required: ["threadId"],
    },
  },
  {
    name: "gmail_create_draft",
    description:
      "Create a Gmail draft (does NOT send — user reviews in Gmail before sending). PREFER THIS over gmail_send_message unless the user says 'send now' or 'send it'. Supports threaded replies: set threadId (from the original message) and inReplyTo (the original message's Message-ID header) so Gmail threads it correctly.",
    input_schema: {
      type: "object" as const,
      properties: {
        to: {
          type: "string",
          description: "Recipient email address (e.g. 'donor@example.org').",
        },
        subject: {
          type: "string",
          description: "Email subject line.",
        },
        body: {
          type: "string",
          description: "Plain-text email body.",
        },
        cc: {
          type: "string",
          description: "CC email address (optional).",
        },
        bcc: {
          type: "string",
          description: "BCC email address (optional).",
        },
        threadId: {
          type: "string",
          description:
            "Gmail thread ID to attach this draft to (for replies). Use the threadId from the original message.",
        },
        inReplyTo: {
          type: "string",
          description:
            "The Message-ID header of the original message (from gmail_get_message result). Enables proper email client threading.",
        },
      },
      required: ["to", "subject", "body"],
    },
  },
  {
    name: "gmail_send_message",
    description:
      "Send a Gmail message immediately. Only use this after the user has explicitly seen the drafted content in chat and confirmed they want to send. For any other case, use gmail_create_draft instead. Supports the same threading params as gmail_create_draft.",
    input_schema: {
      type: "object" as const,
      properties: {
        to: {
          type: "string",
          description: "Recipient email address.",
        },
        subject: {
          type: "string",
          description: "Email subject line.",
        },
        body: {
          type: "string",
          description: "Plain-text email body.",
        },
        cc: {
          type: "string",
          description: "CC email address (optional).",
        },
        bcc: {
          type: "string",
          description: "BCC email address (optional).",
        },
        threadId: {
          type: "string",
          description: "Gmail thread ID for threaded replies (optional).",
        },
        inReplyTo: {
          type: "string",
          description:
            "Message-ID header of the original message for threading (optional).",
        },
      },
      required: ["to", "subject", "body"],
    },
  },
  {
    name: "gmail_modify_labels",
    description:
      "Add or remove labels on a Gmail message. Use to mark as read/unread, star, archive, or move to spam/trash. Built-in labels: INBOX, UNREAD, STARRED, IMPORTANT, SPAM, TRASH, SENT, DRAFT. For custom labels, get their IDs first via gmail_list_labels.",
    input_schema: {
      type: "object" as const,
      properties: {
        messageId: {
          type: "string",
          description: "The Gmail message ID to modify.",
        },
        addLabelIds: {
          type: "array",
          description:
            "Label IDs to add (e.g. ['STARRED', 'IMPORTANT']). Optional.",
          items: { type: "string" },
        },
        removeLabelIds: {
          type: "array",
          description:
            "Label IDs to remove (e.g. ['UNREAD'] to mark as read). Optional.",
          items: { type: "string" },
        },
      },
      required: ["messageId"],
    },
  },
  {
    name: "gmail_list_labels",
    description:
      "List all Gmail labels (both system labels like INBOX/UNREAD and user-created labels). Use this to look up a label's ID when the user refers to a label by name (e.g. 'Donors' or 'Follow Up'). Returns id, name, and type ('system' or 'user') for each label.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool executor
// ---------------------------------------------------------------------------

export async function executeGmailTool({
  name,
  input,
  accessToken,
}: {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: Record<string, unknown>;
  accessToken: string;
}): Promise<{ content: string; is_error?: boolean }> {
  try {
    switch (name) {
      case "gmail_list_messages": {
        const result = await listMessages({
          accessToken,
          query: input.query as string | undefined,
          labelIds: input.labelIds as string[] | undefined,
          maxResults: typeof input.maxResults === "number" ? input.maxResults : 20,
        });
        return { content: JSON.stringify(result) };
      }

      case "gmail_get_message": {
        if (!input.messageId || typeof input.messageId !== "string") {
          return { content: "messageId is required and must be a string.", is_error: true };
        }
        const result = await getMessage({ accessToken, messageId: input.messageId });
        return { content: JSON.stringify(result) };
      }

      case "gmail_list_threads": {
        const result = await listThreads({
          accessToken,
          query: input.query as string | undefined,
          labelIds: input.labelIds as string[] | undefined,
          maxResults: typeof input.maxResults === "number" ? input.maxResults : 10,
        });
        return { content: JSON.stringify(result) };
      }

      case "gmail_get_thread": {
        if (!input.threadId || typeof input.threadId !== "string") {
          return { content: "threadId is required and must be a string.", is_error: true };
        }
        const result = await getThread({ accessToken, threadId: input.threadId });
        return { content: JSON.stringify(result) };
      }

      case "gmail_create_draft": {
        if (!input.to || typeof input.to !== "string") {
          return { content: "to is required and must be a string.", is_error: true };
        }
        if (!input.subject || typeof input.subject !== "string") {
          return { content: "subject is required and must be a string.", is_error: true };
        }
        if (!input.body || typeof input.body !== "string") {
          return { content: "body is required and must be a string.", is_error: true };
        }
        const result = await createDraft({
          accessToken,
          to: input.to,
          subject: input.subject,
          body: input.body,
          cc: input.cc as string | undefined,
          bcc: input.bcc as string | undefined,
          threadId: input.threadId as string | undefined,
          inReplyTo: input.inReplyTo as string | undefined,
        });
        return { content: JSON.stringify(result) };
      }

      case "gmail_send_message": {
        if (!input.to || typeof input.to !== "string") {
          return { content: "to is required and must be a string.", is_error: true };
        }
        if (!input.subject || typeof input.subject !== "string") {
          return { content: "subject is required and must be a string.", is_error: true };
        }
        if (!input.body || typeof input.body !== "string") {
          return { content: "body is required and must be a string.", is_error: true };
        }
        const result = await sendMessage({
          accessToken,
          to: input.to,
          subject: input.subject,
          body: input.body,
          cc: input.cc as string | undefined,
          bcc: input.bcc as string | undefined,
          threadId: input.threadId as string | undefined,
          inReplyTo: input.inReplyTo as string | undefined,
        });
        return { content: JSON.stringify(result) };
      }

      case "gmail_modify_labels": {
        if (!input.messageId || typeof input.messageId !== "string") {
          return { content: "messageId is required and must be a string.", is_error: true };
        }
        const result = await modifyLabels({
          accessToken,
          messageId: input.messageId,
          addLabelIds: input.addLabelIds as string[] | undefined,
          removeLabelIds: input.removeLabelIds as string[] | undefined,
        });
        return { content: JSON.stringify(result) };
      }

      case "gmail_list_labels": {
        const result = await listLabels({ accessToken });
        return { content: JSON.stringify(result) };
      }

      default:
        return {
          content: `Unknown Gmail tool: ${name}`,
          is_error: true,
        };
    }
  } catch (err) {
    if (err instanceof GmailError) {
      return {
        content: `Gmail error (${err.status}): ${err.message}`,
        is_error: true,
      };
    }
    console.error(`[gmail-tool] Unexpected error in ${name}:`, err);
    return {
      content: "Unexpected error calling Gmail API.",
      is_error: true,
    };
  }
}
