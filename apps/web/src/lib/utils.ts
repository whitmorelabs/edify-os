/**
 * Combines class names, filtering out falsy values.
 * Lightweight alternative to clsx for projects without that dependency.
 */
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(" ");
}

/**
 * Returns a human-readable relative time string from an ISO datetime.
 * Used by FileCard and ChatMessages timestamps.
 */
export function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 2) return "yesterday";
  if (days < 7) return `${days}d ago`;

  return new Date(isoString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
