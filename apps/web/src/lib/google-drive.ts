/**
 * Typed REST wrappers for Google Drive v3 API.
 * Uses direct fetch — no googleapis SDK (same pattern as google-gmail.ts).
 * All functions accept a decrypted accessToken string (obtained via getValidGoogleAccessToken).
 *
 * Integration type: "google_drive" (matches GOOGLE_INTEGRATION_TYPES in lib/google.ts).
 */

import { handleJsonResponse } from "@/lib/http";

const DRIVE_BASE = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3";

// ---------------------------------------------------------------------------
// Types — slim shapes surfaced to Claude
// ---------------------------------------------------------------------------

export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  owners?: string[]; // email addresses only
};

// ---------------------------------------------------------------------------
// Error class — mirrors GmailError / GoogleCalendarError shape exactly
// ---------------------------------------------------------------------------

export class DriveError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "DriveError";
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
    makeError: (status, msg) => new DriveError(status, msg),
  });
}

/** Slim projection fields to request from the Files API. */
const FILE_FIELDS =
  "id,name,mimeType,size,createdTime,modifiedTime,webViewLink,owners(emailAddress)";

/** Map the raw Drive API file resource to our slim DriveFile shape. */
function parseFile(raw: Record<string, unknown>): DriveFile {
  const owners = (raw.owners as Array<{ emailAddress?: string }> | undefined)
    ?.map((o) => o.emailAddress ?? "")
    .filter(Boolean);

  return {
    id: raw.id as string,
    name: raw.name as string,
    mimeType: raw.mimeType as string,
    size: raw.size as string | undefined,
    createdTime: raw.createdTime as string | undefined,
    modifiedTime: raw.modifiedTime as string | undefined,
    webViewLink: raw.webViewLink as string | undefined,
    owners,
  };
}

/** Returns true if the file is a Google Workspace document (needs export endpoint). */
function isGoogleDoc(mimeType: string): boolean {
  return mimeType.startsWith("application/vnd.google-apps.");
}

/** Returns true if the file content can be inlined as text. */
function isTextMimeType(mimeType: string): boolean {
  return (
    mimeType === "text/plain" ||
    mimeType === "text/markdown" ||
    mimeType === "text/csv" ||
    mimeType === "text/html" ||
    mimeType === "application/json" ||
    mimeType === "application/vnd.google-apps.document" ||
    mimeType === "application/vnd.google-apps.spreadsheet"
  );
}

// ---------------------------------------------------------------------------
// Drive API functions
// ---------------------------------------------------------------------------

/**
 * List files in Drive. Supports Drive query syntax.
 * Default pageSize 20.
 */
export async function listFiles({
  accessToken,
  query,
  pageSize = 20,
  orderBy,
}: {
  accessToken: string;
  query?: string;
  pageSize?: number;
  orderBy?: string;
}): Promise<{ files: DriveFile[] }> {
  const params = new URLSearchParams({
    pageSize: String(Math.min(Math.max(1, pageSize), 100)),
    fields: `files(${FILE_FIELDS})`,
  });
  if (query) params.set("q", query);
  if (orderBy) params.set("orderBy", orderBy);

  const url = `${DRIVE_BASE}/files?${params}`;
  const response = await fetch(url, { headers: authHeaders(accessToken) });
  const data = await handleResponse<{
    files?: Array<Record<string, unknown>>;
  }>(response);

  return { files: (data.files ?? []).map(parseFile) };
}

/**
 * Search files — thin wrapper over listFiles with a required query.
 * Prefer this over listFiles for specific searches (Drive full-list calls get unwieldy).
 */
export async function searchFiles({
  accessToken,
  query,
  pageSize = 20,
}: {
  accessToken: string;
  query: string;
  pageSize?: number;
}): Promise<{ files: DriveFile[] }> {
  return listFiles({ accessToken, query, pageSize });
}

/**
 * Get file metadata and optionally its text content.
 * For Google Docs, uses the export endpoint (text/plain).
 * For text/plain/markdown, uses alt=media.
 * For binary files, content is not returned (metadata only).
 */
export async function getFile({
  accessToken,
  fileId,
  includeContent = false,
}: {
  accessToken: string;
  fileId: string;
  includeContent?: boolean;
}): Promise<{ file: DriveFile; content?: string }> {
  // Fetch metadata
  const params = new URLSearchParams({ fields: FILE_FIELDS });
  const metaUrl = `${DRIVE_BASE}/files/${encodeURIComponent(fileId)}?${params}`;
  const metaResponse = await fetch(metaUrl, {
    headers: authHeaders(accessToken),
  });
  const raw = await handleResponse<Record<string, unknown>>(metaResponse);
  const file = parseFile(raw);

  if (!includeContent) {
    return { file };
  }

  // Try to inline content for text-capable files
  if (!isTextMimeType(file.mimeType)) {
    return { file };
  }

  const { content } = await downloadFileContent({ accessToken, fileId });
  return { file, content };
}

/**
 * Download the text content of a Drive file.
 * - Google Docs/Sheets: uses the export endpoint (text/plain).
 * - text/plain, text/markdown, application/json, etc.: uses alt=media.
 * - Binary files (images, PDFs, Office binaries): returns error message string.
 * Content is truncated at 8000 chars.
 */
export async function downloadFileContent({
  accessToken,
  fileId,
}: {
  accessToken: string;
  fileId: string;
}): Promise<{ content: string }> {
  const metaParams = new URLSearchParams({ fields: "id,name,mimeType" });
  const metaUrl = `${DRIVE_BASE}/files/${encodeURIComponent(fileId)}?${metaParams}`;
  const metaResponse = await fetch(metaUrl, {
    headers: authHeaders(accessToken),
  });
  const meta = await handleResponse<{ id: string; name: string; mimeType: string }>(
    metaResponse
  );

  if (!isTextMimeType(meta.mimeType)) {
    return {
      content:
        "Non-text file — cannot inline content. Use drive_get_file for metadata only.",
    };
  }

  const contentUrl = isGoogleDoc(meta.mimeType)
    ? `${DRIVE_BASE}/files/${encodeURIComponent(fileId)}/export?${new URLSearchParams({ mimeType: "text/plain" })}`
    : `${DRIVE_BASE}/files/${encodeURIComponent(fileId)}?alt=media`;

  const contentResponse = await fetch(contentUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!contentResponse.ok) {
    let errMsg = contentResponse.statusText;
    try {
      const errBody = await contentResponse.json() as Record<string, unknown>;
      const errObj = errBody?.error as Record<string, unknown> | undefined;
      if (typeof errObj?.message === "string") errMsg = errObj.message;
    } catch {
      // ignore
    }
    throw new DriveError(contentResponse.status, errMsg);
  }

  const text = await contentResponse.text();
  const truncated =
    text.length > 8000 ? text.slice(0, 8000) + "[...truncated]" : text;

  return { content: truncated };
}

/**
 * Create a new plain text or markdown file in Drive.
 * Uses multipart upload to set both metadata and content in one request.
 * Default mimeType: text/plain.
 */
export async function createTextFile({
  accessToken,
  name,
  content,
  parents,
  mimeType = "text/plain",
}: {
  accessToken: string;
  name: string;
  content: string;
  parents?: string[];
  mimeType?: string;
}): Promise<{ file: DriveFile }> {
  const boundary = "-------edify_drive_boundary_314159";
  const metadata: Record<string, unknown> = { name, mimeType };
  if (parents?.length) metadata.parents = parents;

  const metadataPart = JSON.stringify(metadata);
  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    metadataPart,
    `--${boundary}`,
    `Content-Type: ${mimeType}`,
    "",
    content,
    `--${boundary}--`,
  ].join("\r\n");

  const params = new URLSearchParams({
    uploadType: "multipart",
    fields: FILE_FIELDS,
  });
  const url = `${DRIVE_UPLOAD_BASE}/files?${params}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary="${boundary}"`,
    },
    body,
  });

  const raw = await handleResponse<Record<string, unknown>>(response);
  return { file: parseFile(raw) };
}

/**
 * Share a file with a specific email address.
 * role: "reader" | "writer" | "commenter"
 * Uses Drive Permissions endpoint.
 */
export async function shareFile({
  accessToken,
  fileId,
  email,
  role,
}: {
  accessToken: string;
  fileId: string;
  email: string;
  role: "reader" | "writer" | "commenter";
}): Promise<{ permissionId: string; email: string; role: string }> {
  const url = `${DRIVE_BASE}/files/${encodeURIComponent(fileId)}/permissions`;
  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify({
      type: "user",
      role,
      emailAddress: email,
    }),
  });

  const data = await handleResponse<{ id: string; emailAddress?: string; role?: string }>(
    response
  );

  return {
    permissionId: data.id,
    email: data.emailAddress ?? email,
    role: data.role ?? role,
  };
}
