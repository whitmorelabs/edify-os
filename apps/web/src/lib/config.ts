/**
 * Typed runtime config helpers.
 *
 * All values are read from environment variables at module load time.
 * Server-only values (no NEXT_PUBLIC_ prefix) are safe to read here because
 * this module is only imported from server-side code (API routes, lib/chat/).
 */

/**
 * Whether TikTok platform support is enabled.
 * Set ENABLE_TIKTOK=true in .env.local (dev) or in Vercel environment variables (prod).
 * Defaults to false when the variable is absent or set to any value other than "true".
 */
export const ENABLE_TIKTOK: boolean = process.env.ENABLE_TIKTOK === "true";
