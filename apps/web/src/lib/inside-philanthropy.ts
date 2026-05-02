/**
 * Typed wrapper for the Inside Philanthropy public RSS feed.
 * Free, no auth, public feed — WordPress default RSS at /feed.
 *
 * Use case for Dev Director:
 *   Inside Philanthropy is a news/signal source — what's happening NOW in
 *   the foundation world (new programs announced, leadership changes,
 *   funder profiles). It is NOT a structured grants opportunity catalog;
 *   the model should treat each item as a *breadcrumb to investigate*
 *   (chain into ProPublica, foundation_grants_paid_by_ein, charity_navigator)
 *   rather than as a direct grant-finding result.
 *
 * Source: https://www.insidephilanthropy.com/feed
 *   (the trailing-slash form `/feed/` returns a 301 to `/feed`; we hit the
 *    canonical URL directly to avoid the redirect round-trip)
 *
 * Format: standard RSS 2.0. We do TS-native regex parsing — no XML parser
 * dep needed. The feed has predictable shape: <item>...</item> blocks
 * containing <title>, <link>, <pubDate>, <description>, <category> children.
 *
 * Coverage: the feed surfaces the most recent ~10-20 posts. There is no
 * pagination — for older items the user should browse the website directly.
 *
 * Caveats to surface to the model:
 *   - Item descriptions are truncated by the publisher (full content is
 *     gated behind a paywall on the website itself for many articles).
 *   - The feed mixes "Grants P/Q/R/..." foundation profile pages and news
 *     editorial — both are useful, but the profile pages are encyclopedia-
 *     style (steady-state) while news posts are time-sensitive.
 */

const IP_RSS_URL = "https://www.insidephilanthropy.com/feed";
const USER_AGENT =
  "Edify-OS (https://edify.tools) - philanthropy news signal";

/** Hard cap on items returned per call. The feed itself only contains ~20
 *  items at any time; we expose a tighter default for chat brevity. */
export const DEFAULT_IP_LIMIT = 10;
export const MAX_IP_LIMIT = 20;
/** Description text is truncated to this many characters in the projection
 *  to keep model context tight. Full description still in raw feed if needed. */
const DESCRIPTION_MAX_CHARS = 600;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Slim projection of one RSS <item>. */
export type InsidePhilanthropyItem = {
  title: string;
  link: string | null;
  /** Raw RFC-2822 pubDate string from the feed (e.g. "Fri, 01 May 2026 23:39:21 +0000"). */
  pubDate: string | null;
  /** ISO 8601 form parsed from pubDate, or null if parse failed. */
  pubDateIso: string | null;
  /** HTML-stripped, entity-decoded description, capped at ~600 chars. */
  description: string | null;
  /** Up to 3 categories tagged on the item. */
  categories: string[];
  /** dc:creator if present (author byline). */
  creator: string | null;
};

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class InsidePhilanthropyError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "InsidePhilanthropyError";
  }
}

// ---------------------------------------------------------------------------
// RSS / HTML helpers
// ---------------------------------------------------------------------------

/** Decode the HTML entities that show up in WordPress RSS feeds. Covers the
 *  five XML-mandatory entities + numeric refs (decimal and hex). */
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, d) => {
      const n = Number(d);
      return Number.isFinite(n) ? String.fromCodePoint(n) : "";
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) =>
      String.fromCodePoint(parseInt(h, 16)),
    );
}

/** Strip HTML tags and decode entities. Does NOT preserve any structure —
 *  this is for plain-text projection of an RSS description. */
function htmlToPlainText(html: string): string {
  // Remove script/style blocks first (rare in RSS but defensive).
  const noScript = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  const noTags = noScript.replace(/<[^>]+>/g, " ");
  return decodeEntities(noTags).replace(/\s+/g, " ").trim();
}

/** Read the inner text of a single tag, supporting both
 *  <tag>text</tag> and <tag><![CDATA[text]]></tag> shapes. Returns the
 *  raw inner content (NO HTML stripping) so callers can decide whether
 *  to render or flatten. */
function readChild(item: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = item.match(re);
  if (!m) return null;
  let inner = m[1];
  const cdata = inner.match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);
  if (cdata) inner = cdata[1];
  return inner.trim();
}

/** Read all occurrences of a child tag — used for <category> which can
 *  appear multiple times per <item>. */
function readChildren(item: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "gi");
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(item)) !== null) {
    let inner = m[1];
    const cdata = inner.match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);
    if (cdata) inner = cdata[1];
    const t = inner.trim();
    if (t) out.push(t);
  }
  return out;
}

/** Convert RFC-2822 pubDate to ISO 8601 via Date.parse. Returns null on
 *  un-parseable input. */
function pubDateToIso(raw: string | null): string | null {
  if (!raw) return null;
  const ms = Date.parse(raw);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toISOString();
}

/** Iterate over each <item>...</item> block. */
function* iterateItems(rss: string): Generator<string> {
  const re = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(rss)) !== null) {
    yield m[1];
  }
}

function projectItem(itemXml: string): InsidePhilanthropyItem {
  const titleRaw = readChild(itemXml, "title") ?? "";
  const linkRaw = readChild(itemXml, "link");
  const pubDateRaw = readChild(itemXml, "pubDate");
  const descriptionRaw = readChild(itemXml, "description");
  const creatorRaw = readChild(itemXml, "dc:creator");
  const categories = readChildren(itemXml, "category").slice(0, 3);

  const description = descriptionRaw
    ? (() => {
        const flat = htmlToPlainText(descriptionRaw);
        return flat.length > DESCRIPTION_MAX_CHARS
          ? `${flat.slice(0, DESCRIPTION_MAX_CHARS).trimEnd()}...`
          : flat;
      })()
    : null;

  return {
    title: decodeEntities(titleRaw),
    link: linkRaw ? linkRaw : null,
    pubDate: pubDateRaw,
    pubDateIso: pubDateToIso(pubDateRaw),
    description,
    categories: categories.map(decodeEntities),
    creator: creatorRaw ? decodeEntities(creatorRaw) : null,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type GetInsidePhilanthropyRecentParams = {
  /** Optional case-insensitive contains-match filter. Tested against title +
   *  description. Items with no description fall back to title-only match. */
  keyword?: string;
  /** Max items returned. Default 10, capped at 20. */
  limit?: number;
};

/**
 * Fetch and parse the Inside Philanthropy RSS feed.
 *
 * Returns recent items in feed order (publisher's reverse-chronological).
 * If `keyword` is supplied, filters in-memory after parse — the feed has no
 * server-side search.
 */
export async function getInsidePhilanthropyRecent(
  params: GetInsidePhilanthropyRecentParams = {},
): Promise<{
  items: InsidePhilanthropyItem[];
  totalInFeed: number;
  feedTitle: string | null;
}> {
  const limit = Math.max(
    1,
    Math.min(params.limit ?? DEFAULT_IP_LIMIT, MAX_IP_LIMIT),
  );
  const keyword = params.keyword?.trim() ?? "";

  const response = await fetch(IP_RSS_URL, {
    method: "GET",
    redirect: "follow",
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml, */*",
      "User-Agent": USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new InsidePhilanthropyError(
      response.status,
      `Inside Philanthropy RSS returned HTTP ${response.status} (${response.statusText}).`,
    );
  }

  const xml = await response.text();

  // Pull channel-level <title> for context (NOT first <title> — that's the
  // feed-level header outside <item> blocks; we read it explicitly from the
  // <channel> wrapper to avoid grabbing an item title).
  const channelMatch = xml.match(
    /<channel[^>]*>([\s\S]*?)<\/channel>/i,
  );
  let feedTitle: string | null = null;
  if (channelMatch) {
    // First <title> inside <channel>, before any <item>.
    const beforeFirstItem = channelMatch[1].split(/<item[^>]*>/i)[0];
    const t = readChild(beforeFirstItem, "title");
    if (t) feedTitle = decodeEntities(t);
  }

  const all: InsidePhilanthropyItem[] = [];
  for (const itemXml of iterateItems(xml)) {
    all.push(projectItem(itemXml));
  }

  let filtered = all;
  if (keyword) {
    const needle = keyword.toLowerCase();
    filtered = all.filter((it) => {
      const hay = `${it.title} ${it.description ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }

  return {
    items: filtered.slice(0, limit),
    totalInFeed: all.length,
    feedTitle,
  };
}
