/**
 * Shared HTTP response handling utilities.
 * Used by API modules (google-calendar.ts, grants-gov.ts) and future Gmail/Drive modules.
 * Each caller provides its own error class and extraction logic —
 * only the boilerplate of "parse JSON or fall back to statusText" lives here.
 */

export async function handleJsonResponse<T>(
  response: Response,
  options: {
    /** Pull a human-readable message out of the parsed error body. Return undefined to fall back to statusText. */
    extractMessage?: (body: unknown) => string | undefined;
    /** Construct the domain-specific error to throw. */
    makeError: (status: number, msg: string) => Error;
  }
): Promise<T> {
  if (response.ok) {
    return response.json() as Promise<T>;
  }
  let msg = response.statusText;
  try {
    const body = await response.json();
    const extracted = options.extractMessage?.(body);
    if (extracted) msg = extracted;
  } catch {
    // Body wasn't JSON (e.g. HTML 502 from upstream gateway) — use statusText as-is.
  }
  throw options.makeError(response.status, msg);
}

/**
 * Coerce an unknown value to a finite number, returning null for non-number
 * inputs or non-finite numbers (NaN/Infinity). Useful when projecting external
 * API responses where numeric fields may arrive as strings, nulls, or undefined.
 */
export function toFiniteNumber(v: unknown): number | null {
  if (typeof v !== "number") return null;
  return Number.isFinite(v) ? v : null;
}
