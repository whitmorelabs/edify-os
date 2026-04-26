/**
 * Anthropic tool definition and executor for brand guideline extraction.
 * One tool: brand_guidelines_from_url. Marketing Director only.
 *
 * How it works:
 *   1. Kida calls this with a URL (org website or brand doc).
 *   2. Tool fetches the URL and extracts HTML.
 *   3. A sub-Claude call (Haiku) analyzes the HTML for brand signals:
 *      colors, typography, logo, org name, mission, and voice/tone.
 *   4. The extracted guidelines are saved in two places:
 *      a. Google Drive — a Google Doc at "Edify OS / Marketing Director / Brand Guidelines.gdoc"
 *         (uses ensureArchetypeFolder + drive_create_file pattern from existing drive.ts)
 *      b. Org memory — key brand facts written via save_to_memory DB path
 *         (uses same Supabase insert as memory.ts executeMemoryTool)
 *   5. Returns a confirmation with the Drive file link and a summary.
 *
 * Graceful degradation:
 *   - Drive not connected → saves to memory only, reports Drive as skipped
 *   - URL fetch fails (CORS, auth, 4xx) → returns error for Kida to relay
 *   - Sub-Claude parse fails → falls back to whatever partial data was extracted
 *
 * PDF deferred: fetching raw PDFs requires binary handling. For Sprint 2 we
 * scope to HTML pages only. The model note about PDF deferral is included
 * in the tool description so Kida doesn't try to use it for PDF uploads.
 */

import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getValidGoogleAccessToken } from "@/lib/google";
import { createFile } from "@/lib/google-drive";
import { ensureArchetypeFolder } from "@/lib/tools/drive-folders";

// ---------------------------------------------------------------------------
// System-prompt addendum
// ---------------------------------------------------------------------------

export const BRAND_GUIDELINES_TOOLS_ADDENDUM = `\nYou have access to \`brand_guidelines_from_url\`. Use it when the user wants to extract brand guidelines from their website or brand page — colors, fonts, mission, voice. The tool saves results to Google Drive and org memory so all directors can access them.`;

// ---------------------------------------------------------------------------
// Tool definition
// ---------------------------------------------------------------------------

export const brandGuidelinesTools: Anthropic.Tool[] = [
  {
    name: "brand_guidelines_from_url",
    description:
      "Extract brand guidelines from an organization's website URL. Pulls colors, typography, logo URL, mission statement, org name, and voice/tone from the page. Saves a Brand Guidelines document to Google Drive (Edify OS / Marketing Director folder) and stores key brand facts in org memory for all directors to access. HTML pages only — PDF uploads are not yet supported. Requires Google Drive to be connected for the Drive save; org memory save works regardless.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description:
            "The organization's website URL or brand page URL (e.g., 'https://example-nonprofit.org' or 'https://example-nonprofit.org/about'). Must be a publicly accessible HTTP/HTTPS page.",
        },
        org_name_hint: {
          type: "string",
          description:
            "Optional: the organization's known name to help confirm extraction accuracy (e.g., 'Lights of Hope'). If omitted, the tool infers the name from the page.",
        },
      },
      required: ["url"],
    },
  },
];

// ---------------------------------------------------------------------------
// Executor
// ---------------------------------------------------------------------------

const MAX_HTML_CHARS = 40_000; // Haiku context limit buffer

export async function executeBrandGuidelinesTool({
  name,
  input,
  orgId,
  memberId,
  serviceClient,
  anthropic,
}: {
  name: string;
  input: Record<string, unknown>;
  orgId: string;
  memberId: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceClient: SupabaseClient<any>;
  anthropic: Anthropic;
}): Promise<{ content: string; is_error?: boolean }> {
  if (name !== "brand_guidelines_from_url") {
    return { content: `Unknown brand guidelines tool: ${name}`, is_error: true };
  }

  const rawUrl = input.url as string | undefined;
  const orgNameHint = input.org_name_hint as string | undefined;

  if (!rawUrl?.trim()) {
    return { content: "url is required.", is_error: true };
  }

  // Validate URL shape
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl.trim());
  } catch {
    return { content: `Invalid URL: "${rawUrl}". Provide a full URL including https://.`, is_error: true };
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return { content: "Only http:// and https:// URLs are supported.", is_error: true };
  }

  // ---------------------------------------------------------------------------
  // Step 1: Fetch the URL
  // ---------------------------------------------------------------------------
  let htmlContent: string;
  try {
    const fetchRes = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; EdifyOS/2.0; +https://edifyos.com)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!fetchRes.ok) {
      return {
        content: `Could not fetch the page (HTTP ${fetchRes.status}). Check that the URL is publicly accessible and try again.`,
        is_error: true,
      };
    }

    const contentType = fetchRes.headers.get("content-type") ?? "";
    if (contentType.includes("application/pdf")) {
      return {
        content:
          "PDF files are not yet supported by this tool. Please paste the URL to the organization's website or 'About' page instead.",
        is_error: true,
      };
    }

    const rawText = await fetchRes.text();
    // Truncate to avoid overloading the sub-Claude context window
    htmlContent = rawText.slice(0, MAX_HTML_CHARS);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown fetch error";
    return {
      content: `Failed to fetch "${parsedUrl.toString()}": ${msg}. Check the URL and try again.`,
      is_error: true,
    };
  }

  // ---------------------------------------------------------------------------
  // Step 2: Sub-Claude extraction (Haiku)
  // ---------------------------------------------------------------------------
  const extractionPrompt = `You are a brand analyst. Extract brand identity information from the following HTML page source.

${orgNameHint ? `Known org name hint: "${orgNameHint}"` : ""}

Extract and return ONLY a JSON object with this exact shape (no markdown, no extra text):
{
  "org_name": "Full organization name from title tag, h1, or schema.org",
  "mission": "1-2 sentence mission statement from h1/hero copy or About section. Null if not found.",
  "primary_colors": ["#hex1", "#hex2"],
  "fonts": ["FontName1", "FontName2"],
  "logo_url": "URL to logo image (from <link rel=icon>, og:image, or <img> near logo attributes). Null if not found.",
  "voice_summary": "2-3 sentence summary of the org's writing style and tone based on body copy samples.",
  "sample_headlines": ["up to 3 representative h1/h2 headings from the page"],
  "website_url": "${parsedUrl.toString()}"
}

Rules:
- For primary_colors: scan CSS variables (--primary, --brand, --accent, etc.), meta theme-color, og:image color cues, and the most prominent non-white/non-black colors in inline style attributes or class names.
- For fonts: look for font-family in <style> tags, CSS variables, or Google Fonts <link> tags.
- If a field cannot be extracted, use null (not an empty string).
- Return ONLY the JSON object — no explanation, no markdown fences.

HTML (truncated):
${htmlContent}`;

  let extracted: {
    org_name: string | null;
    mission: string | null;
    primary_colors: string[];
    fonts: string[];
    logo_url: string | null;
    voice_summary: string | null;
    sample_headlines: string[];
    website_url: string;
  };

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      temperature: 0.1,
      messages: [
        {
          role: "user",
          content: extractionPrompt,
        },
      ],
    });

    const rawText = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    extracted = JSON.parse(rawText) as typeof extracted;
  } catch (err) {
    console.error("[brand-guidelines] Sub-Claude extraction failed:", err);
    // Partial fallback
    extracted = {
      org_name: orgNameHint ?? null,
      mission: null,
      primary_colors: [],
      fonts: [],
      logo_url: null,
      voice_summary: null,
      sample_headlines: [],
      website_url: parsedUrl.toString(),
    };
  }

  const orgName = extracted.org_name ?? orgNameHint ?? "Unknown Organization";

  // ---------------------------------------------------------------------------
  // Step 3: Save to org memory (always — no external token needed)
  // ---------------------------------------------------------------------------
  const memoryEntries = buildMemoryEntries(orgName, extracted);
  // memory_entries has no unique constraint, so we check for duplicates before writing.
  // Parallel select phase → parallel write phase (2N DB calls instead of N*(2 serial)).
  const existingRows = await Promise.allSettled(
    memoryEntries.map((entry) =>
      serviceClient
        .from("memory_entries")
        .select("id")
        .eq("org_id", orgId)
        .eq("category", entry.category)
        .eq("title", entry.title)
        .maybeSingle()
    )
  );

  const memoryResults = await Promise.allSettled(
    memoryEntries.map((entry, i) => {
      const lookupResult = existingRows[i];
      const existingId =
        lookupResult.status === "fulfilled" ? (lookupResult.value.data?.id as string | null) : null;

      if (existingId) {
        return serviceClient
          .from("memory_entries")
          .update({ content: entry.content, source: "brand_guidelines_tool" })
          .eq("id", existingId);
      }

      return serviceClient.from("memory_entries").insert({
        org_id: orgId,
        category: entry.category,
        title: entry.title,
        content: entry.content,
        source: "brand_guidelines_tool",
        created_by: memberId ?? undefined,
        auto_generated: true,
      });
    })
  );

  const memorySaveCount = memoryResults.filter((r) => r.status === "fulfilled").length;

  // ---------------------------------------------------------------------------
  // Step 4: Save to Google Drive (best-effort — if Drive not connected, skip)
  // ---------------------------------------------------------------------------
  let driveResult: { saved: boolean; link?: string; error?: string } = { saved: false };

  const driveTokenResult = await getValidGoogleAccessToken(serviceClient, orgId, "google_drive");

  if (!("error" in driveTokenResult)) {
    const { accessToken: driveToken } = driveTokenResult;
    try {
      // Ensure "Edify OS / Marketing Director" folder exists
      const folderId = await ensureArchetypeFolder(driveToken, "marketing_director");

      // Build the document content
      const docContent = buildBrandGuidelinesDocument(orgName, extracted, parsedUrl.toString());

      const { file } = await createFile({
        accessToken: driveToken,
        name: `${orgName} — Brand Guidelines`,
        content: docContent,
        format: "google_doc",
        parents: [folderId],
      });

      driveResult = {
        saved: true,
        link: file.webViewLink ?? `https://drive.google.com/file/d/${file.id}/view`,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Drive save failed";
      console.error("[brand-guidelines] Drive save failed:", err);
      driveResult = { saved: false, error: msg };
    }
  } else {
    driveResult = {
      saved: false,
      error:
        "Google Drive is not connected. Connect Google in Settings → Integrations to also save to Drive.",
    };
  }

  // ---------------------------------------------------------------------------
  // Step 5: Return confirmation
  // ---------------------------------------------------------------------------
  const summary = {
    ok: true,
    org_name: orgName,
    extracted: {
      mission: extracted.mission,
      primary_colors: extracted.primary_colors,
      fonts: extracted.fonts,
      logo_url: extracted.logo_url,
      voice_summary: extracted.voice_summary,
      sample_headlines: extracted.sample_headlines,
    },
    memory: {
      saved: memorySaveCount > 0,
      entries_saved: memorySaveCount,
    },
    drive: driveResult,
    message: buildConfirmationMessage(orgName, extracted, driveResult, memorySaveCount),
  };

  return { content: JSON.stringify(summary) };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface MemoryEntry {
  category: string;
  title: string;
  content: string;
}

/** Converts an org name to a short, stable kebab-case slug for memory entry titles. */
function orgSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 40);
}

function buildMemoryEntries(
  orgName: string,
  extracted: {
    mission: string | null;
    primary_colors: string[];
    fonts: string[];
    logo_url: string | null;
    voice_summary: string | null;
    sample_headlines: string[];
    website_url: string;
  }
): MemoryEntry[] {
  const entries: MemoryEntry[] = [];

  if (extracted.mission) {
    entries.push({
      category: "brand_voice",
      title: `brand-mission-${orgSlug(orgName)}`,
      content: `Mission: ${extracted.mission}`,
    });
  }

  if (extracted.primary_colors.length > 0) {
    entries.push({
      category: "brand_voice",
      title: `brand-colors-${orgSlug(orgName)}`,
      content: `Brand colors: ${extracted.primary_colors.join(", ")}`,
    });
  }

  if (extracted.fonts.length > 0) {
    entries.push({
      category: "brand_voice",
      title: `brand-fonts-${orgSlug(orgName)}`,
      content: `Brand fonts: ${extracted.fonts.join(", ")}`,
    });
  }

  if (extracted.voice_summary) {
    entries.push({
      category: "brand_voice",
      title: `brand-voice-${orgSlug(orgName)}`,
      content: `Voice and tone: ${extracted.voice_summary}`,
    });
  }

  if (extracted.logo_url) {
    entries.push({
      category: "brand_voice",
      title: `brand-logo-${orgSlug(orgName)}`,
      content: `Logo URL: ${extracted.logo_url}`,
    });
  }

  return entries;
}

function buildBrandGuidelinesDocument(
  orgName: string,
  extracted: {
    mission: string | null;
    primary_colors: string[];
    fonts: string[];
    logo_url: string | null;
    voice_summary: string | null;
    sample_headlines: string[];
    website_url: string;
  },
  sourceUrl: string
): string {
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const lines: string[] = [
    `Brand Guidelines — ${orgName}`,
    `Extracted by Edify OS on ${date}`,
    `Source: ${sourceUrl}`,
    "",
    "---",
    "",
    "ORGANIZATION",
    `Name: ${orgName}`,
  ];

  if (extracted.mission) {
    lines.push(`Mission: ${extracted.mission}`);
  }

  lines.push("", "VISUAL IDENTITY");

  if (extracted.primary_colors.length > 0) {
    lines.push(`Brand Colors: ${extracted.primary_colors.join(", ")}`);
  } else {
    lines.push("Brand Colors: Not detected");
  }

  if (extracted.fonts.length > 0) {
    lines.push(`Typography: ${extracted.fonts.join(", ")}`);
  } else {
    lines.push("Typography: Not detected");
  }

  if (extracted.logo_url) {
    lines.push(`Logo: ${extracted.logo_url}`);
  }

  lines.push("", "VOICE AND TONE");

  if (extracted.voice_summary) {
    lines.push(extracted.voice_summary);
  } else {
    lines.push("Voice summary: Not enough body copy found to summarize.");
  }

  if (extracted.sample_headlines.length > 0) {
    lines.push("", "SAMPLE HEADLINES FROM WEBSITE");
    extracted.sample_headlines.forEach((h, i) => {
      lines.push(`${i + 1}. ${h}`);
    });
  }

  lines.push(
    "",
    "---",
    "This document was auto-generated by Edify OS Marketing Director.",
    "Review and refine with your team before using in brand guidelines."
  );

  return lines.join("\n");
}

function buildConfirmationMessage(
  orgName: string,
  extracted: {
    primary_colors: string[];
    fonts: string[];
    mission: string | null;
    voice_summary: string | null;
  },
  driveResult: { saved: boolean; link?: string; error?: string },
  memorySaveCount: number
): string {
  const parts: string[] = [];

  parts.push(`Brand guidelines extracted for ${orgName}.`);

  const bullets: string[] = [];
  if (extracted.primary_colors.length > 0) {
    bullets.push(`Colors: ${extracted.primary_colors.join(", ")}`);
  }
  if (extracted.fonts.length > 0) {
    bullets.push(`Fonts: ${extracted.fonts.join(", ")}`);
  }
  if (extracted.mission) {
    bullets.push(`Mission captured.`);
  }
  if (extracted.voice_summary) {
    bullets.push(`Voice/tone summarized.`);
  }
  if (bullets.length > 0) {
    parts.push(`Found: ${bullets.join(" | ")}`);
  }

  if (driveResult.saved && driveResult.link) {
    parts.push(`Saved to Drive: ${driveResult.link}`);
  } else if (driveResult.error) {
    parts.push(`Drive save skipped: ${driveResult.error}`);
  }

  if (memorySaveCount > 0) {
    parts.push(
      `${memorySaveCount} brand facts saved to org memory — colors, fonts, and voice are now available to all directors.`
    );
  }

  return parts.join(" ");
}
