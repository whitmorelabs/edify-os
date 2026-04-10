/**
 * Combines class names, filtering out falsy values.
 * Lightweight alternative to clsx for projects without that dependency.
 */
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(" ");
}
