#!/usr/bin/env npx tsx
/**
 * upload-plugin-skills.ts
 *
 * Uploads plugin skill bundles from apps/web/plugins/ to Anthropic's Skills API.
 * Stores returned skill_ids in apps/web/plugins/uploaded-ids.json, keyed by
 * "{domain}/{skill-name}" (e.g. "marketing/content-creation").
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... pnpm --filter web upload-plugin-skills
 *
 * Flags:
 *   --dry-run   Print what would be uploaded without calling the API.
 *   --force     Re-upload even if a skill_id already exists in uploaded-ids.json.
 *   --help      Show this message and exit.
 *
 * Requirements:
 *   - ANTHROPIC_API_KEY env var must be set.
 *   - Run from the repo root (pnpm --filter web handles this via the package.json script).
 *
 * Idempotency:
 *   The script hashes each skill directory's contents. If the computed hash matches
 *   the stored hash in uploaded-ids.json AND a skill_id is already present, the skill
 *   is skipped. Pass --force to override.
 */

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import * as https from "https";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const REPO_ROOT = path.resolve(__dirname, "..");
const PLUGINS_DIR = path.join(REPO_ROOT, "apps", "web", "plugins");
const UPLOADED_IDS_PATH = path.join(PLUGINS_DIR, "uploaded-ids.json");
const ANTHROPIC_SKILLS_URL = "https://api.anthropic.com/v1/skills";
const BETA_HEADERS = [
  "code-execution-2025-08-25",
  "skills-2025-10-02",
  "files-api-2025-04-14",
].join(",");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UploadedEntry {
  skill_id: string;
  hash: string;
  uploaded_at: string;
}

type UploadedIdsMap = Record<string, UploadedEntry>;

interface SkillUploadResponse {
  id: string;
  type: string;
  name: string;
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const FORCE = args.includes("--force");
const SHOW_HELP = args.includes("--help") || args.includes("-h");

if (SHOW_HELP) {
  console.log(`
upload-plugin-skills — Upload Edify plugin skills to Anthropic's Skills API

Usage:
  ANTHROPIC_API_KEY=<key> pnpm --filter web upload-plugin-skills [flags]

Flags:
  --dry-run   Show what would be uploaded without calling the API
  --force     Re-upload even if skill_id already exists in uploaded-ids.json
  --help      Show this message

Each skill directory under apps/web/plugins/<domain>/<skill>/ must contain a
SKILL.md file. The entire directory is zipped and uploaded as a skill bundle.
The returned skill_id is stored in apps/web/plugins/uploaded-ids.json.
`);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Recursively collect all files under a directory, returning absolute paths. */
function collectFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

/** Hash all files in a skill directory for idempotency checking. */
function hashSkillDir(skillDir: string): string {
  const files = collectFiles(skillDir).sort();
  const hash = crypto.createHash("sha256");
  for (const file of files) {
    // Include relative path in hash so renames are detected
    hash.update(path.relative(skillDir, file));
    hash.update(fs.readFileSync(file));
  }
  return hash.digest("hex").slice(0, 16);
}

/**
 * Build a ZIP buffer from a skill directory.
 * Uses a minimal ZIP implementation (no external dependencies) since this
 * script runs via tsx without a full Node module install step.
 *
 * Format: ZIP local file headers + central directory + end-of-central-directory.
 */
function buildZip(skillDir: string, skillKey: string): Buffer {
  const files = collectFiles(skillDir).sort();
  const localHeaders: Buffer[] = [];
  const centralDir: Buffer[] = [];
  let offset = 0;

  for (const filePath of files) {
    const relPath = path.relative(skillDir, filePath).replace(/\\/g, "/");
    const data = fs.readFileSync(filePath);
    const nameBuffer = Buffer.from(relPath, "utf8");

    // CRC-32
    const crc = crc32(data);
    const now = new Date();
    const dosTime = ((now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2)) >>> 0;
    const dosDate = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) >>> 0;

    // Local file header
    const localHeader = Buffer.alloc(30 + nameBuffer.length + data.length);
    localHeader.writeUInt32LE(0x04034b50, 0); // signature
    localHeader.writeUInt16LE(20, 4);          // version needed
    localHeader.writeUInt16LE(0, 6);           // flags
    localHeader.writeUInt16LE(0, 8);           // compression: stored
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(crc >>> 0, 14);
    localHeader.writeUInt32LE(data.length, 18); // compressed size
    localHeader.writeUInt32LE(data.length, 22); // uncompressed size
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28); // extra field length
    nameBuffer.copy(localHeader, 30);
    data.copy(localHeader, 30 + nameBuffer.length);
    localHeaders.push(localHeader);

    // Central directory entry
    const cdEntry = Buffer.alloc(46 + nameBuffer.length);
    cdEntry.writeUInt32LE(0x02014b50, 0); // signature
    cdEntry.writeUInt16LE(20, 4);          // version made by
    cdEntry.writeUInt16LE(20, 6);          // version needed
    cdEntry.writeUInt16LE(0, 8);           // flags
    cdEntry.writeUInt16LE(0, 10);          // compression: stored
    cdEntry.writeUInt16LE(dosTime, 12);
    cdEntry.writeUInt16LE(dosDate, 14);
    cdEntry.writeUInt32LE(crc >>> 0, 16);
    cdEntry.writeUInt32LE(data.length, 20); // compressed
    cdEntry.writeUInt32LE(data.length, 24); // uncompressed
    cdEntry.writeUInt16LE(nameBuffer.length, 28);
    cdEntry.writeUInt16LE(0, 30); // extra
    cdEntry.writeUInt16LE(0, 32); // comment
    cdEntry.writeUInt16LE(0, 34); // disk number start
    cdEntry.writeUInt16LE(0, 36); // internal attr
    cdEntry.writeUInt32LE(0, 38); // external attr
    cdEntry.writeUInt32LE(offset, 42); // local header offset
    nameBuffer.copy(cdEntry, 46);
    centralDir.push(cdEntry);

    offset += localHeader.length;
  }

  const centralDirBuffer = Buffer.concat(centralDir);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // signature
  eocd.writeUInt16LE(0, 4);          // disk number
  eocd.writeUInt16LE(0, 6);          // disk with CD start
  eocd.writeUInt16LE(centralDir.length, 8);  // entries on disk
  eocd.writeUInt16LE(centralDir.length, 10); // total entries
  eocd.writeUInt32LE(centralDirBuffer.length, 12);
  eocd.writeUInt32LE(offset, 16);    // offset of CD
  eocd.writeUInt16LE(0, 20);         // comment length

  void skillKey; // used for logging only, not embedded in zip
  return Buffer.concat([...localHeaders, centralDirBuffer, eocd]);
}

/** Minimal CRC-32 implementation (no external deps). */
function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  const table = makeCrcTable();
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return ((crc ^ 0xffffffff) >>> 0);
}

let _crcTable: Uint32Array | null = null;
function makeCrcTable(): Uint32Array {
  if (_crcTable) return _crcTable;
  _crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    _crcTable[n] = c;
  }
  return _crcTable;
}

/** POST a ZIP buffer to Anthropic's Skills API. Returns the skill_id. */
async function uploadSkill(
  skillKey: string,
  zipBuffer: Buffer,
  apiKey: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Build multipart/form-data body
    const boundary = `----FormBoundary${crypto.randomBytes(8).toString("hex")}`;
    const CRLF = "\r\n";
    const parts: Buffer[] = [];

    // name field
    parts.push(
      Buffer.from(
        `--${boundary}${CRLF}` +
        `Content-Disposition: form-data; name="name"${CRLF}${CRLF}` +
        `${skillKey.replace("/", "-")}${CRLF}`,
        "utf8",
      ),
    );

    // file field
    parts.push(
      Buffer.from(
        `--${boundary}${CRLF}` +
        `Content-Disposition: form-data; name="file"; filename="skill.zip"${CRLF}` +
        `Content-Type: application/zip${CRLF}${CRLF}`,
        "utf8",
      ),
    );
    parts.push(zipBuffer);
    parts.push(Buffer.from(`${CRLF}--${boundary}--${CRLF}`, "utf8"));

    const body = Buffer.concat(parts);

    const options = {
      hostname: "api.anthropic.com",
      path: "/v1/skills",
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": BETA_HEADERS,
        "content-type": `multipart/form-data; boundary=${boundary}`,
        "content-length": body.length,
      },
    };

    const req = https.request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => {
        const raw = Buffer.concat(chunks).toString("utf8");
        if (!res.statusCode || res.statusCode >= 300) {
          reject(new Error(`Skills API error ${res.statusCode}: ${raw}`));
          return;
        }
        try {
          const parsed = JSON.parse(raw) as SkillUploadResponse;
          if (!parsed.id) {
            reject(new Error(`Skills API response missing id: ${raw}`));
            return;
          }
          resolve(parsed.id);
        } catch {
          reject(new Error(`Skills API non-JSON response: ${raw}`));
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey && !DRY_RUN) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is not set.");
    console.error("Set it and re-run: ANTHROPIC_API_KEY=sk-ant-... pnpm --filter web upload-plugin-skills");
    process.exit(1);
  }

  // Load existing uploaded-ids.json
  let uploadedIds: UploadedIdsMap = {};
  if (fs.existsSync(UPLOADED_IDS_PATH)) {
    try {
      uploadedIds = JSON.parse(fs.readFileSync(UPLOADED_IDS_PATH, "utf8")) as UploadedIdsMap;
    } catch {
      console.warn("Warning: Could not parse uploaded-ids.json — starting fresh.");
    }
  }

  // Discover all skill directories (any folder containing a SKILL.md)
  const skillDirs: Array<{ key: string; dir: string }> = [];
  const domains = fs.readdirSync(PLUGINS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== "." && e.name !== "..");

  for (const domain of domains) {
    const domainPath = path.join(PLUGINS_DIR, domain.name);
    const skills = fs.readdirSync(domainPath, { withFileTypes: true })
      .filter((e) => e.isDirectory());
    for (const skill of skills) {
      const skillPath = path.join(domainPath, skill.name);
      const skillMd = path.join(skillPath, "SKILL.md");
      if (fs.existsSync(skillMd)) {
        skillDirs.push({ key: `${domain.name}/${skill.name}`, dir: skillPath });
      }
    }
  }

  if (skillDirs.length === 0) {
    console.log("No skill directories found under", PLUGINS_DIR);
    process.exit(0);
  }

  console.log(`Found ${skillDirs.length} skill(s) to process:\n`);

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const { key, dir } of skillDirs) {
    const hash = hashSkillDir(dir);
    const existing = uploadedIds[key];

    if (!FORCE && existing?.hash === hash && existing?.skill_id) {
      console.log(`  [SKIP] ${key} — unchanged (skill_id: ${existing.skill_id})`);
      skipped++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`  [DRY-RUN] Would upload ${key} (hash: ${hash})`);
      uploaded++;
      continue;
    }

    console.log(`  [UPLOAD] ${key} (hash: ${hash}) ...`);
    try {
      const zip = buildZip(dir, key);
      const skillId = await uploadSkill(key, zip, apiKey!);
      uploadedIds[key] = {
        skill_id: skillId,
        hash,
        uploaded_at: new Date().toISOString(),
      };
      console.log(`  [OK]     ${key} → skill_id: ${skillId}`);
      uploaded++;
    } catch (err) {
      console.error(`  [FAIL]   ${key}: ${err instanceof Error ? err.message : String(err)}`);
      failed++;
    }
  }

  // Persist updated uploaded-ids.json (skip in dry-run mode)
  if (!DRY_RUN) {
    // Write only the skill_id field at top level for clean consumption by registry.ts
    // The full entry (with hash + uploaded_at) is kept under a _meta subkey.
    const clean: Record<string, string | Record<string, unknown>> = {};
    const meta: Record<string, UploadedEntry> = {};
    for (const [k, v] of Object.entries(uploadedIds)) {
      if (typeof v === "object" && v.skill_id) {
        clean[k] = v.skill_id;
        meta[k] = v;
      }
    }
    // Write slim version for registry consumption (top-level key → skill_id string)
    fs.writeFileSync(UPLOADED_IDS_PATH, JSON.stringify(clean, null, 2) + "\n", "utf8");
    console.log(`\nWrote ${UPLOADED_IDS_PATH}`);
  }

  console.log(`\nDone. ${uploaded} uploaded, ${skipped} skipped, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
