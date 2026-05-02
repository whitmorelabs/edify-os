/**
 * Foundation grants-paid lookup — replicates Candid's "funder X gave $Y to Z"
 * crown-jewel data using free public sources.
 *
 * Pipeline:
 *  1. Resolve EIN → IRS e-file object_id list by scraping the ProPublica
 *     org page HTML. ProPublica's JSON API does NOT expose object_ids; the
 *     HTML page does (in the `download-xml?object_id=...` link per filing
 *     row, in reverse-chronological order). We pair this list against
 *     filings_with_data from the JSON API to map object_id → tax year.
 *  2. Fetch the IRS e-file XML from GivingTuesday's free public S3 mirror
 *     (`s3://gt990datalake-rawdata/EfileData/XmlFiles/{object_id}_public.xml`)
 *     — anonymous access, ~1-10 sec download depending on filing size, no
 *     AWS credentials required.
 *  3. Parse 990-PF Part XV ("GrantOrContributionPdDurYrGrp") OR 990 Schedule
 *     I ("GrantsOtherOrgsInUSGrp") via small custom regex-based extraction
 *     — no XML parser dep needed; the field set we surface is small and the
 *     IRS schema is stable across years.
 *
 * Why NOT the IRS direct download endpoint:
 *   apps.irs.gov/pub/epostcard/990/xml only exposes monthly ZIPs (~50-200
 *   MB each). GT's data lake is the same data unpacked per-filing — much
 *   smaller per-query.
 *
 * Data lag:
 *   990-PF returns are filed ~6-18 months after the fiscal year ends, then
 *   take another 1-3 months to reach the IRS public e-file dataset. So as
 *   of mid-2026, the most recent data available for most foundations is
 *   tax year 2023 (some 2024). Surface this caveat in tool output.
 *
 * Truncation:
 *   Large foundations file thousands of grants per year (Ford Foundation
 *   2023 = 3,718 grants in a 5.4 MB XML). We surface the top N by amount
 *   and document the cap so the user knows.
 *
 * No caching in this sprint:
 *   Per-query S3 fetch + parse runs ~3-10 sec for typical 990-PFs. Acceptable
 *   for chat UX. A Supabase cache layer is a future-sprint concern.
 *
 * References:
 *   https://990data.givingtuesday.org/access-via-aws-account-2/
 *   https://github.com/grantmakers/grantmakers-next  (precedent ETL)
 *   https://github.com/jsfenfen/990-xml-reader        (IRSx — Python ref)
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPUBLICA_HTML_BASE =
  "https://projects.propublica.org/nonprofits/organizations";
const PROPUBLICA_JSON_BASE =
  "https://projects.propublica.org/nonprofits/api/v2/organizations";
const GT_DATALAKE_XML_BASE =
  "https://gt990datalake-rawdata.s3.us-east-1.amazonaws.com/EfileData/XmlFiles";

const USER_AGENT =
  "Edify-OS (https://edify.tools) - nonprofit grant graph research";

/** Hard cap on grants surfaced per call. Top N by amount. */
export const DEFAULT_GRANTS_LIMIT = 25;
export const MAX_GRANTS_LIMIT = 50;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** One grant paid by a foundation, projected from 990-PF Part XV /
 *  990 Schedule I. */
export type FoundationGrantPaid = {
  /** Recipient organization name (BusinessName) OR person name. */
  recipientName: string;
  /** "organization" | "person". Distinguishes orgs from individual fellowships. */
  recipientType: "organization" | "person";
  /** Recipient EIN if reported on the filing. Null on most 990-PF rows
   *  (Part XV doesn't require EIN). Usually populated on 990 Schedule I. */
  recipientEin: string | null;
  /** Recipient city (best-effort from US or foreign address). */
  recipientCity: string | null;
  /** Recipient state (US filings) or province (foreign). */
  recipientState: string | null;
  /** Recipient country code. "US" implied if absent. */
  recipientCountry: string | null;
  /** Grant amount in USD as filed. */
  amount: number;
  /** Free-text purpose statement from the return. */
  purpose: string | null;
  /** Recipient's IRS foundation status code if reported (e.g. "PC", "I", "NC"). */
  recipientFoundationStatus: string | null;
};

/** Aggregate response — list of grants + filing metadata for verification. */
export type FoundationGrantsResponse = {
  /** Foundation EIN (formatted "XX-XXXXXXX"). */
  ein: string;
  /** Foundation name from the 990 ReturnHeader. */
  foundationName: string | null;
  /** Tax year of the filing (e.g. 2023). */
  taxYear: number;
  /** Form type as reported in the XML (e.g. "990PF" or "990"). */
  formType: string;
  /** Total count of grant rows in the filing (BEFORE truncation). */
  totalGrantsInFiling: number;
  /** Total dollar value of all grants in the filing (BEFORE truncation). */
  totalGrantsAmount: number;
  /** The actual rows surfaced (top N by amount, capped per `limit`). */
  grants: FoundationGrantPaid[];
  /** True if grants were truncated. */
  truncated: boolean;
  /** Object ID of the e-file XML, for verification reference. */
  objectId: string;
  /** Direct URL to the underlying XML on GT's S3 mirror. */
  xmlUrl: string;
  /** PDF URL on ProPublica (where available) for human verification.
   *  May be from a different tax year than `taxYear` if the JSON cache lags
   *  the HTML — use `propublicaFilingUrl` for the canonical-by-objectId link. */
  pdfUrl: string | null;
  /** ProPublica filing detail page for the matched object_id — always
   *  aligned with `objectId`/`taxYear`. Use this for human verification. */
  propublicaFilingUrl: string;
};

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class FoundationGrantsError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "FoundationGrantsError";
  }
}

// ---------------------------------------------------------------------------
// Helpers — request shaping
// ---------------------------------------------------------------------------

function defaultHeaders(): Record<string, string> {
  return {
    "User-Agent": USER_AGENT,
    Accept: "*/*",
  };
}

function cleanEin(ein: string): string {
  const c = ein.replace(/\D/g, "");
  if (!c) {
    throw new FoundationGrantsError(400, "ein is required.");
  }
  return c;
}

function formatEin(cleanDigits: string): string {
  const padded = cleanDigits.padStart(9, "0");
  return `${padded.slice(0, 2)}-${padded.slice(2)}`;
}

// ---------------------------------------------------------------------------
// Step 1: resolve object_id list for an EIN
// ---------------------------------------------------------------------------

type FilingRef = {
  /** IRS e-file object ID (18 digits — first 4 = submission year). */
  objectId: string;
  /** Tax year resolved by pairing with ProPublica JSON filings_with_data. */
  taxYear: number | null;
  /** ProPublica PDF URL if known (for human verification). */
  pdfUrl: string | null;
};

/**
 * Scrape ProPublica's HTML org page to extract IRS e-file object IDs.
 * Pairs them with the JSON-API filings_with_data list (both reverse-chrono
 * order) to map object_id → tax year.
 *
 * Why scrape: ProPublica's JSON API surfaces a `pdf_url` containing a
 * different (16-digit ProPublica-internal) ID — NOT the IRS object_id we
 * need. The HTML page is the only place ProPublica exposes the real
 * object_id (in the per-row "Download XML" link).
 *
 * Returns object_ids in reverse-chronological order (most-recent filing first).
 */
async function resolveFilingsByEin(
  cleanedEin: string,
): Promise<{ filings: FilingRef[]; foundationName: string | null }> {
  // Fire HTML + JSON in parallel.
  const [htmlResp, jsonResp] = await Promise.all([
    fetch(`${PROPUBLICA_HTML_BASE}/${cleanedEin}`, {
      method: "GET",
      headers: defaultHeaders(),
    }),
    fetch(`${PROPUBLICA_JSON_BASE}/${cleanedEin}.json`, {
      method: "GET",
      headers: { ...defaultHeaders(), Accept: "application/json" },
    }),
  ]);

  if (htmlResp.status === 404 || jsonResp.status === 404) {
    throw new FoundationGrantsError(
      404,
      `No nonprofit found at ProPublica for EIN ${cleanedEin}.`,
    );
  }
  if (!htmlResp.ok || !jsonResp.ok) {
    throw new FoundationGrantsError(
      Math.max(htmlResp.status, jsonResp.status),
      `ProPublica returned HTTP ${htmlResp.status} (HTML) / ${jsonResp.status} (JSON).`,
    );
  }

  const html = await htmlResp.text();
  const json = (await jsonResp.json()) as Record<string, unknown>;

  // Extract object_ids in document order from the HTML — these come from
  // <a href="/nonprofits/download-xml?object_id=NNNNN">XML</a> links and
  // are listed reverse-chronologically.
  const objectIdMatches = Array.from(
    html.matchAll(/object_id=(\d{16,20})/g),
  ).map((m) => m[1]);
  const objectIds: string[] = [];
  const seen = new Set<string>();
  for (const id of objectIdMatches) {
    if (!seen.has(id)) {
      seen.add(id);
      objectIds.push(id);
    }
  }

  // Pair with JSON filings_with_data — both are reverse-chrono, both filter
  // to e-filed returns. Length sometimes differs by 1 (HTML occasionally
  // shows a newer filing PP's JSON cache hasn't picked up). We zip on the
  // shorter length and leave any extra object_ids without a tax year (the
  // XML's <TaxPeriodEndDt> can fill in if needed).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filingsWithData: Record<string, any>[] = Array.isArray(
    json.filings_with_data,
  )
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (json.filings_with_data as Record<string, any>[])
    : [];

  const filings: FilingRef[] = objectIds.map((objectId, idx) => {
    const matched = filingsWithData[idx];
    return {
      objectId,
      taxYear:
        matched && typeof matched.tax_yr === "number"
          ? (matched.tax_yr as number)
          : null,
      pdfUrl:
        matched && typeof matched.pdf_url === "string"
          ? (matched.pdf_url as string)
          : null,
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const org: Record<string, any> = (json.organization ?? {}) as Record<
    string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any
  >;
  const foundationName = typeof org.name === "string" ? org.name : null;

  return { filings, foundationName };
}

// ---------------------------------------------------------------------------
// Step 2: fetch raw 990 XML from GivingTuesday Data Lake
// ---------------------------------------------------------------------------

async function fetchXmlByObjectId(objectId: string): Promise<string> {
  const url = `${GT_DATALAKE_XML_BASE}/${objectId}_public.xml`;
  const resp = await fetch(url, {
    method: "GET",
    headers: defaultHeaders(),
  });
  if (resp.status === 404) {
    throw new FoundationGrantsError(
      404,
      `Filing object ${objectId} not found in GT Data Lake (file may not yet be mirrored).`,
    );
  }
  if (!resp.ok) {
    throw new FoundationGrantsError(
      resp.status,
      `GT Data Lake returned HTTP ${resp.status} for object ${objectId}.`,
    );
  }
  return resp.text();
}

// ---------------------------------------------------------------------------
// Step 3: parse Schedule I / 990-PF Part XV grants paid
// ---------------------------------------------------------------------------

/**
 * Read the first occurrence of <ChildTag>VALUE</ChildTag> inside `xml`,
 * regardless of namespace prefix. Returns null if not present.
 *
 * Used for parsing tiny known-shape XML fragments (one grant block, one
 * ReturnHeader). Not safe for arbitrary XML — but the IRS e-file schema is
 * fixed and the fields we extract are leaf-level text nodes.
 */
function readTag(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`);
  const m = xml.match(re);
  if (!m) return null;
  // Decode common XML entities. Field text in IRS returns is already
  // mostly clean ASCII but we cover the standard 5 + numeric entities.
  return decodeXmlText(m[1].trim());
}

function decodeXmlText(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) =>
      String.fromCodePoint(parseInt(h, 16)),
    );
}

/** Parse one <GrantOrContributionPdDurYrGrp> block (990-PF Part XV) or
 *  <RecipientTable> / <GrantsOtherOrgsInUSGrp> block (990 Schedule I).
 *  Returns null if the block lacks an amount (skipped row). */
function parseGrantBlock(block: string): FoundationGrantPaid | null {
  // 990-PF Part XV uses <Amt>; 990 Schedule I uses <CashGrantAmt>.
  const amountStr =
    readTag(block, "Amt") ?? readTag(block, "CashGrantAmt") ?? null;
  if (!amountStr) return null;
  const amount = Number(amountStr.replace(/[^0-9.\-]/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return null;

  // Recipient name — business OR person.
  const businessName =
    readTag(block, "BusinessNameLine1Txt") ??
    readTag(block, "BusinessNameLine1") ??
    null;
  const personName = readTag(block, "RecipientPersonNm");
  let recipientName: string;
  let recipientType: "organization" | "person";
  if (businessName) {
    recipientName = businessName;
    recipientType = "organization";
  } else if (personName) {
    recipientName = personName;
    recipientType = "person";
  } else {
    // Some blocks bury the name inside <RecipientBusinessName> wrapper —
    // try reading any text inside that.
    const wrapper = block.match(
      /<RecipientBusinessName[^>]*>([\s\S]*?)<\/RecipientBusinessName>/,
    );
    const fallback = wrapper
      ? wrapper[1]
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
      : null;
    if (!fallback) return null;
    recipientName = fallback;
    recipientType = "organization";
  }

  // Recipient address — pull from US or foreign address subnodes.
  // 990-PF Part XV uses <RecipientUSAddress> / <RecipientForeignAddress>.
  // 990 Schedule I uses <USAddress> / <ForeignAddress> (no "Recipient" prefix).
  const usAddr =
    block.match(
      /<RecipientUSAddress[^>]*>([\s\S]*?)<\/RecipientUSAddress>/,
    ) ?? block.match(/<USAddress[^>]*>([\s\S]*?)<\/USAddress>/);
  const foreignAddr =
    block.match(
      /<RecipientForeignAddress[^>]*>([\s\S]*?)<\/RecipientForeignAddress>/,
    ) ?? block.match(/<ForeignAddress[^>]*>([\s\S]*?)<\/ForeignAddress>/);
  const addrXml = usAddr?.[1] ?? foreignAddr?.[1] ?? "";
  const recipientCity = readTag(addrXml, "CityNm");
  const recipientState =
    readTag(addrXml, "StateAbbreviationCd") ??
    readTag(addrXml, "ProvinceOrStateNm");
  const recipientCountry =
    readTag(addrXml, "CountryCd") ?? (usAddr ? "US" : null);

  // Recipient EIN — when reported (rare on 990-PF Part XV, common on 990
  // Schedule I).
  const recipientEinRaw = readTag(block, "RecipientEIN");
  const recipientEin = recipientEinRaw
    ? formatEin(recipientEinRaw.replace(/\D/g, ""))
    : null;

  return {
    recipientName,
    recipientType,
    recipientEin,
    recipientCity,
    recipientState,
    recipientCountry,
    amount,
    purpose:
      readTag(block, "GrantOrContributionPurposeTxt") ??
      readTag(block, "PurposeOfGrantTxt") ??
      null,
    recipientFoundationStatus: readTag(block, "RecipientFoundationStatusTxt"),
  };
}

/** Iterate over each <GrantOrContributionPdDurYrGrp> ... </...> block
 *  without buffering the entire match list (some 990-PFs have 5,000+
 *  grants — we still buffer all parsed rows but parsing is streaming). */
function* iterateGrantBlocks(xml: string): Generator<string> {
  const re =
    /<(GrantOrContributionPdDurYrGrp|GrantsOtherOrgsInUSGrp|RecipientTable)[^>]*>([\s\S]*?)<\/\1>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    yield m[2];
  }
}

/** Read filing metadata from <ReturnHeader>. */
function parseReturnHeader(xml: string): {
  taxYear: number | null;
  formType: string;
  filerName: string | null;
} {
  // <ReturnHeader> ... <TaxPeriodEndDt>YYYY-MM-DD</TaxPeriodEndDt>
  // <ReturnTypeCd>990PF</ReturnTypeCd> or <ReturnType>990PF</ReturnType>
  // <Filer><BusinessName><BusinessNameLine1Txt>FORD FOUNDATION</...
  const headerMatch = xml.match(/<ReturnHeader[^>]*>([\s\S]*?)<\/ReturnHeader>/);
  const header = headerMatch ? headerMatch[1] : xml;

  const taxPeriodEndDt = readTag(header, "TaxPeriodEndDt");
  let taxYear: number | null = null;
  if (taxPeriodEndDt) {
    const y = parseInt(taxPeriodEndDt.slice(0, 4), 10);
    if (Number.isFinite(y)) taxYear = y;
  }

  const formType =
    readTag(header, "ReturnTypeCd") ??
    readTag(header, "ReturnType") ??
    "unknown";

  // Filer name — look inside <Filer> or top-level <BusinessNameLine1Txt>.
  const filerMatch = header.match(/<Filer[^>]*>([\s\S]*?)<\/Filer>/);
  const filerXml = filerMatch ? filerMatch[1] : header;
  const filerName =
    readTag(filerXml, "BusinessNameLine1Txt") ??
    readTag(filerXml, "BusinessNameLine1") ??
    null;

  return { taxYear, formType, filerName };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type GetFoundationGrantsParams = {
  /** Foundation EIN — accepts "13-1684331" or "131684331". */
  ein: string;
  /** Tax year (e.g. 2023). If omitted, uses the most recent available filing. */
  year?: number;
  /** Cap on grants surfaced (default 25, max 50). Top N by amount. */
  limit?: number;
};

/**
 * Look up grants paid by a foundation in a given tax year.
 *
 * Throws FoundationGrantsError on any failure. Catch and surface the error
 * message to the user in the tool executor.
 */
export async function getFoundationGrants(
  params: GetFoundationGrantsParams,
): Promise<FoundationGrantsResponse> {
  const cleaned = cleanEin(params.ein);
  const limit = Math.max(
    1,
    Math.min(params.limit ?? DEFAULT_GRANTS_LIMIT, MAX_GRANTS_LIMIT),
  );

  // 1) Resolve filings list.
  const { filings, foundationName: ppName } = await resolveFilingsByEin(cleaned);
  if (filings.length === 0) {
    throw new FoundationGrantsError(
      404,
      `No e-filed returns found at ProPublica for EIN ${cleaned}. The org may file paper returns or may not be tax-exempt.`,
    );
  }

  // 2) Pick the target filing — exact-year match if requested, else most recent.
  //
  // The JSON-paired taxYear from PP can be off-by-one when PP's HTML has a
  // newer filing than the JSON cache reflects (HTML and JSON are both
  // reverse-chronological, but the HTML occasionally has one extra row at
  // the top). The XML's <TaxPeriodEndDt> is the source of truth — when the
  // user requests a specific year, we may need to probe a couple of
  // candidates to find the right one.
  let target: FilingRef | undefined;
  let xml: string;
  let header: ReturnType<typeof parseReturnHeader>;

  if (typeof params.year === "number") {
    const requestedYear = params.year;
    // Build candidate list ordered by likelihood:
    //   1. JSON-paired taxYear === requested year
    //   2. First-4-digit-of-objectId === year + 1 (typical submission year)
    //   3. First-4-digit-of-objectId === year + 2 (late-filed)
    const candidates: FilingRef[] = [];
    const seen = new Set<string>();
    const pushUnique = (f?: FilingRef) => {
      if (f && !seen.has(f.objectId)) {
        seen.add(f.objectId);
        candidates.push(f);
      }
    };
    pushUnique(filings.find((f) => f.taxYear === requestedYear));
    pushUnique(
      filings.find((f) => f.objectId.startsWith(String(requestedYear + 1))),
    );
    pushUnique(
      filings.find((f) => f.objectId.startsWith(String(requestedYear + 2))),
    );
    // Last resort: try the off-by-one neighbor of the JSON-paired match
    // (HTML/JSON skew shifts the index by 1).
    const jsonIdx = filings.findIndex((f) => f.taxYear === requestedYear);
    if (jsonIdx >= 0) {
      pushUnique(filings[jsonIdx + 1]);
      pushUnique(filings[jsonIdx - 1]);
    }

    if (candidates.length === 0) {
      throw new FoundationGrantsError(
        404,
        `No filing found for tax year ${requestedYear}. Available years: ${filings
          .map((f) => f.taxYear)
          .filter((y) => y != null)
          .join(", ")}. 990-PF data lags ~12-18 months from fiscal year end.`,
      );
    }

    // Probe each candidate, take the first whose XML <TaxPeriodEndDt> matches.
    let matched: { target: FilingRef; xml: string; header: ReturnType<typeof parseReturnHeader> } | null = null;
    let lastFetched: { target: FilingRef; xml: string; header: ReturnType<typeof parseReturnHeader> } | null = null;
    for (const candidate of candidates) {
      const candXml = await fetchXmlByObjectId(candidate.objectId);
      const candHeader = parseReturnHeader(candXml);
      lastFetched = { target: candidate, xml: candXml, header: candHeader };
      if (candHeader.taxYear === requestedYear) {
        matched = lastFetched;
        break;
      }
    }
    if (!matched) {
      // None of the candidates matched. Surface what we found so the user
      // can adjust.
      if (!lastFetched) {
        throw new FoundationGrantsError(
          500,
          `Could not retrieve any candidate XML for tax year ${requestedYear}.`,
        );
      }
      throw new FoundationGrantsError(
        404,
        `No filing matched tax year ${requestedYear}. Closest candidate was tax year ${lastFetched.header.taxYear}. Try year=${lastFetched.header.taxYear} or omit year for most recent.`,
      );
    }
    target = matched.target;
    xml = matched.xml;
    header = matched.header;
  } else {
    target = filings[0];
    xml = await fetchXmlByObjectId(target.objectId);
    header = parseReturnHeader(xml);
  }

  // 3) Parse grant blocks.
  const grantsAll: FoundationGrantPaid[] = [];
  let totalAmount = 0;
  for (const block of iterateGrantBlocks(xml)) {
    const parsed = parseGrantBlock(block);
    if (parsed) {
      grantsAll.push(parsed);
      totalAmount += parsed.amount;
    }
  }

  // 4) Top N by amount.
  grantsAll.sort((a, b) => b.amount - a.amount);
  const grants = grantsAll.slice(0, limit);

  return {
    ein: formatEin(cleaned),
    foundationName: header.filerName ?? ppName,
    taxYear: header.taxYear ?? target.taxYear ?? 0,
    formType: header.formType,
    totalGrantsInFiling: grantsAll.length,
    totalGrantsAmount: totalAmount,
    grants,
    truncated: grantsAll.length > grants.length,
    objectId: target.objectId,
    xmlUrl: `${GT_DATALAKE_XML_BASE}/${target.objectId}_public.xml`,
    pdfUrl: target.pdfUrl,
    propublicaFilingUrl: `${PROPUBLICA_HTML_BASE}/${cleaned}/${target.objectId}/full`,
  };
}
