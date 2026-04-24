/**
 * Drive folder structure helper for Edify OS archetypes.
 *
 * Each archetype stores its generated files under:
 *   Edify OS / {Archetype Label} / ...
 *
 * `ensureArchetypeFolder` finds or creates this folder tree and returns the
 * leaf folder ID. The result is used as the `parents` param when calling
 * drive_create_file so files land in the right place instead of Drive root.
 *
 * This module only does folder management — it does NOT touch file content
 * or any other Drive operations.
 */

const DRIVE_BASE = "https://www.googleapis.com/drive/v3";

/** Drive MIME type for folders. */
const FOLDER_MIME = "application/vnd.google-apps.folder";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function authHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

/**
 * Find a folder by name under a given parent (or root).
 * Returns the folder ID, or null if not found.
 */
async function findFolder(
  accessToken: string,
  name: string,
  parentId?: string
): Promise<string | null> {
  const clauses = [
    `mimeType = '${FOLDER_MIME}'`,
    `name = '${name.replace(/'/g, "\\'")}'`,
    "trashed = false",
  ];
  if (parentId) {
    clauses.push(`'${parentId}' in parents`);
  }

  const params = new URLSearchParams({
    q: clauses.join(" and "),
    fields: "files(id)",
    pageSize: "1",
  });

  const resp = await fetch(`${DRIVE_BASE}/files?${params}`, {
    headers: authHeaders(accessToken),
  });

  if (!resp.ok) return null;
  const data = (await resp.json()) as { files?: Array<{ id: string }> };
  return data.files?.[0]?.id ?? null;
}

/**
 * Create a folder under a given parent (or root).
 * Returns the new folder ID.
 */
async function createFolder(
  accessToken: string,
  name: string,
  parentId?: string
): Promise<string> {
  const metadata: Record<string, unknown> = {
    name,
    mimeType: FOLDER_MIME,
  };
  if (parentId) metadata.parents = [parentId];

  const resp = await fetch(`${DRIVE_BASE}/files?fields=id`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify(metadata),
  });

  if (!resp.ok) {
    let errMsg = resp.statusText;
    try {
      const errBody = (await resp.json()) as Record<string, unknown>;
      const errObj = errBody?.error as Record<string, unknown> | undefined;
      if (typeof errObj?.message === "string") errMsg = errObj.message;
    } catch {
      // ignore
    }
    throw new Error(`Drive folder create failed (${resp.status}): ${errMsg}`);
  }

  const data = (await resp.json()) as { id: string };
  return data.id;
}

/**
 * Find a folder or create it if it doesn't exist.
 * Returns the folder ID.
 */
async function findOrCreateFolder(
  accessToken: string,
  name: string,
  parentId?: string
): Promise<string> {
  const existing = await findFolder(accessToken, name, parentId);
  if (existing) return existing;
  return createFolder(accessToken, name, parentId);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Archetype label → folder name mapping.
 * These names are human-readable and match the folder paths described in the PRD:
 *   Edify OS / HR & Volunteer Coordinator / ...
 *   Edify OS / Development Director / ...
 *   etc.
 */
export const ARCHETYPE_FOLDER_NAMES: Record<string, string> = {
  hr_volunteer_coordinator: "HR & Volunteer Coordinator",
  development_director: "Development Director",
  marketing_director: "Marketing Director",
  executive_assistant: "Executive Assistant",
  programs_director: "Programs Director",
  events_director: "Events Director",
};

/** Root folder name — all archetype subfolders live inside this. */
const ROOT_FOLDER_NAME = "Edify OS";

/**
 * Ensures the folder path `Edify OS / {archetypeLabel}` exists in Drive.
 * Creates missing folders on the fly. Returns the archetype subfolder ID.
 *
 * @param accessToken   Valid Google Drive access token.
 * @param archetypeSlug Archetype slug (e.g. "hr_volunteer_coordinator").
 * @returns             The Drive folder ID to use as `parents[0]`.
 */
export async function ensureArchetypeFolder(
  accessToken: string,
  archetypeSlug: string
): Promise<string> {
  const archetypeFolderName =
    ARCHETYPE_FOLDER_NAMES[archetypeSlug] ?? archetypeSlug.replace(/_/g, " ");

  // Step 1 — find or create the root "Edify OS" folder
  const rootId = await findOrCreateFolder(accessToken, ROOT_FOLDER_NAME);

  // Step 2 — find or create the per-archetype subfolder inside root
  const archetypeFolderId = await findOrCreateFolder(
    accessToken,
    archetypeFolderName,
    rootId
  );

  return archetypeFolderId;
}
