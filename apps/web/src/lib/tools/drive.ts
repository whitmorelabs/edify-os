/**
 * Anthropic tool definitions and executor for Google Drive.
 * Six tools: drive_list_files, drive_search_files, drive_get_file,
 * drive_create_file, drive_share_file, drive_download_content.
 *
 * Tool descriptions are written as model-facing prompt engineering.
 * Layout mirrors gmail.ts almost exactly — deviations only for Drive-specific
 * concerns (query syntax, export vs alt=media, permission model).
 */

import type Anthropic from "@anthropic-ai/sdk";
import {
  listFiles,
  searchFiles,
  getFile,
  createFile,
  shareFile,
  downloadFileContent,
  DriveError,
  type DriveFileFormat,
} from "@/lib/google-drive";
import { ensureArchetypeFolder } from "@/lib/tools/drive-folders";

// ---------------------------------------------------------------------------
// System-prompt addendum for archetypes that have Drive tools active.
// Kept here so it stays co-located with the tool definitions it describes.
// ---------------------------------------------------------------------------

export const DRIVE_TOOLS_ADDENDUM = `\nYou have access to the user's Google Drive via tools. Prefer drive_search_files over drive_list_files when looking for specific documents — Drive can contain thousands of files and full-list calls are noisy. Always confirm a file's name before creating — never silently overwrite. Never fabricate file contents; call drive_get_file or drive_download_content to see what's actually there. For Google Docs and Sheets, content is exported as plain text. Binary files (images, PDFs, Office binaries) cannot be inlined — use drive_get_file for metadata only. When creating a document, the default format is 'google_doc' (a real Google Doc). Only use format='text' or format='markdown' when the user explicitly asks for a plain text or markdown file.`;

// ---------------------------------------------------------------------------
// Tool definitions (model-facing)
// ---------------------------------------------------------------------------

export const driveTools: Anthropic.Tool[] = [
  {
    name: "drive_list_files",
    description:
      "List files in the user's Google Drive (slim view: id, name, mimeType, size, createdTime, modifiedTime, webViewLink, owners). Use for broad browsing. For specific lookups, prefer drive_search_files which accepts a required Drive query. Supports optional Drive query syntax (e.g. \"mimeType = 'application/vnd.google-apps.document'\", \"'me' in owners\"). Defaults to 20 results.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description:
            "Drive query string (e.g. \"name contains 'grant'\" or \"mimeType = 'application/vnd.google-apps.spreadsheet'\"). Optional — omit to list recent files.",
        },
        pageSize: {
          type: "number",
          description: "Max files to return (1–100). Defaults to 20.",
        },
        orderBy: {
          type: "string",
          description:
            "Sort order (e.g. 'modifiedTime desc', 'name', 'createdTime desc'). Optional.",
        },
      },
      required: [],
    },
  },
  {
    name: "drive_search_files",
    description:
      "Search for files in Google Drive using Drive query syntax. Use this whenever the user is looking for a specific file, document type, or files matching a description. Required query examples: \"name contains 'brand guidelines'\", \"mimeType = 'application/vnd.google-apps.document' and name contains 'grant'\", \"'user@example.org' in writers\". Returns id, name, mimeType, size, modifiedTime, webViewLink, owners.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description:
            "Drive query string (required). Examples: \"name contains 'budget'\", \"mimeType = 'application/vnd.google-apps.spreadsheet'\", \"modifiedTime > '2026-01-01T00:00:00Z'\".",
        },
        pageSize: {
          type: "number",
          description: "Max files to return (1–100). Defaults to 20.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "drive_get_file",
    description:
      "Get metadata for a specific Drive file by ID, and optionally its text content. For Google Docs and Sheets, content is exported as plain text (up to 8000 chars). For plain text or markdown files, content is returned directly. Binary files (images, PDFs, Office binaries) return metadata only — content is not inlined. Do not guess file IDs; use drive_search_files first.",
    input_schema: {
      type: "object" as const,
      properties: {
        fileId: {
          type: "string",
          description: "The Drive file ID from a prior drive_search_files or drive_list_files call.",
        },
        includeContent: {
          type: "boolean",
          description:
            "Whether to include the file's text content in the response. Defaults to false. Set to true when the user wants to read a document.",
        },
      },
      required: ["fileId"],
    },
  },
  {
    name: "drive_create_file",
    description:
      "Create a new file in Google Drive. Default format is Google Doc (a real .gdoc that opens in Google Docs). Use when the user asks to create a document, save notes, draft a proposal, or write content to Drive. Always confirm the desired file name and content before creating — this cannot be undone and does not overwrite existing files (a new file with the same name is created). Supports optional parent folder ID.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "File name (e.g. 'Grant Draft' or 'Meeting Notes 2026-04-20').",
        },
        content: {
          type: "string",
          description: "Text content to seed into the file. May be empty for a blank document.",
        },
        format: {
          type: "string",
          enum: ["google_doc", "google_sheet", "google_slide", "text", "markdown"],
          description:
            "File format. Defaults to 'google_doc' (a real Google Doc). Use 'google_sheet' for spreadsheets, 'google_slide' for presentations, 'text' for plain .txt files, 'markdown' for .md files. When in doubt, use 'google_doc'.",
        },
        parents: {
          type: "array",
          description:
            "Optional list of parent folder IDs (Drive folder IDs). If omitted, the file is placed in the root of My Drive.",
          items: { type: "string" },
        },
      },
      required: ["name", "content"],
    },
  },
  {
    name: "drive_share_file",
    description:
      "Share a Drive file with a specific email address. Use when the user wants to give someone access to a file. Always confirm the file name, recipient email, and permission level before sharing. Role options: 'reader' (view only), 'commenter' (view + comment), 'writer' (edit). Requires the user to own the file or have share permission.",
    input_schema: {
      type: "object" as const,
      properties: {
        fileId: {
          type: "string",
          description: "The Drive file ID to share. Get this from drive_search_files first.",
        },
        email: {
          type: "string",
          description: "Email address of the person to share with.",
        },
        role: {
          type: "string",
          enum: ["reader", "commenter", "writer"],
          description:
            "Permission level: 'reader' (view), 'commenter' (view + comment), 'writer' (edit).",
        },
      },
      required: ["fileId", "email", "role"],
    },
  },
  {
    name: "drive_download_content",
    description:
      "Download the text content of a Drive file. Explicitly text-only: works for Google Docs (exported as plain text), Google Sheets (exported as plain text), text/plain, text/markdown, and application/json files. Returns an error for binary files (images, PDFs, Office binaries). Content is truncated at 8000 chars. Use this when you already know the file ID and only need the content.",
    input_schema: {
      type: "object" as const,
      properties: {
        fileId: {
          type: "string",
          description: "The Drive file ID. Get this from drive_search_files or drive_list_files.",
        },
      },
      required: ["fileId"],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool executor
// ---------------------------------------------------------------------------

export async function executeDriveTool({
  name,
  input,
  accessToken,
  archetypeSlug,
}: {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: Record<string, unknown>;
  accessToken: string;
  /**
   * Optional archetype slug. When provided and the tool call is drive_create_file
   * without an explicit parents array, the file will be created under
   * "Edify OS / {Archetype Label}" in Drive. Does not affect other drive tools.
   */
  archetypeSlug?: string;
}): Promise<{ content: string; is_error?: boolean }> {
  try {
    switch (name) {
      case "drive_list_files": {
        const result = await listFiles({
          accessToken,
          query: input.query as string | undefined,
          pageSize: typeof input.pageSize === "number" ? input.pageSize : 20,
          orderBy: input.orderBy as string | undefined,
        });
        return { content: JSON.stringify(result) };
      }

      case "drive_search_files": {
        if (!input.query || typeof input.query !== "string") {
          return { content: "query is required and must be a string.", is_error: true };
        }
        const result = await searchFiles({
          accessToken,
          query: input.query,
          pageSize: typeof input.pageSize === "number" ? input.pageSize : 20,
        });
        return { content: JSON.stringify(result) };
      }

      case "drive_get_file": {
        if (!input.fileId || typeof input.fileId !== "string") {
          return { content: "fileId is required and must be a string.", is_error: true };
        }
        const result = await getFile({
          accessToken,
          fileId: input.fileId,
          includeContent: input.includeContent === true,
        });
        return { content: JSON.stringify(result) };
      }

      case "drive_create_file": {
        if (!input.name || typeof input.name !== "string") {
          return { content: "name is required and must be a string.", is_error: true };
        }
        if (typeof input.content !== "string") {
          return { content: "content is required and must be a string.", is_error: true };
        }
        const validFormats: DriveFileFormat[] = [
          "google_doc", "google_sheet", "google_slide", "text", "markdown",
        ];
        const format =
          typeof input.format === "string" && validFormats.includes(input.format as DriveFileFormat)
            ? (input.format as DriveFileFormat)
            : undefined;

        // Resolve parents: honour the model's explicit choice; fall back to the
        // archetype folder when no parents are specified and an archetypeSlug is known.
        let parents = input.parents as string[] | undefined;
        if ((!parents || parents.length === 0) && archetypeSlug) {
          try {
            const folderId = await ensureArchetypeFolder(accessToken, archetypeSlug);
            parents = [folderId];
          } catch (folderErr) {
            // Non-fatal: log and continue — file goes to Drive root if folder can't be resolved.
            console.warn("[drive-tool] ensureArchetypeFolder failed, falling back to root:", folderErr);
          }
        }

        const result = await createFile({
          accessToken,
          name: input.name,
          content: input.content,
          parents,
          format,
        });
        return { content: JSON.stringify(result) };
      }

      case "drive_share_file": {
        if (!input.fileId || typeof input.fileId !== "string") {
          return { content: "fileId is required and must be a string.", is_error: true };
        }
        if (!input.email || typeof input.email !== "string") {
          return { content: "email is required and must be a string.", is_error: true };
        }
        const validRoles = ["reader", "commenter", "writer"] as const;
        type Role = typeof validRoles[number];
        if (!input.role || !validRoles.includes(input.role as Role)) {
          return {
            content: "role is required and must be one of: reader, commenter, writer.",
            is_error: true,
          };
        }
        const result = await shareFile({
          accessToken,
          fileId: input.fileId,
          email: input.email,
          role: input.role as Role,
        });
        return { content: JSON.stringify(result) };
      }

      case "drive_download_content": {
        if (!input.fileId || typeof input.fileId !== "string") {
          return { content: "fileId is required and must be a string.", is_error: true };
        }
        const result = await downloadFileContent({
          accessToken,
          fileId: input.fileId,
        });
        return { content: JSON.stringify(result) };
      }

      default:
        return {
          content: `Unknown Drive tool: ${name}`,
          is_error: true,
        };
    }
  } catch (err) {
    if (err instanceof DriveError) {
      return {
        content: `Drive error (${err.status}): ${err.message}`,
        is_error: true,
      };
    }
    console.error(`[drive-tool] Unexpected error in ${name}:`, err);
    return {
      content: "Unexpected error calling Drive API.",
      is_error: true,
    };
  }
}
