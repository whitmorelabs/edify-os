// Utility for storing and retrieving the Claude API key from localStorage.
// The key never leaves the browser.

const STORAGE_KEY = "edify_claude_api_key";

export function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setApiKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, key.trim());
  } catch {
    // ignore quota errors
  }
}

export function clearApiKey(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function hasApiKey(): boolean {
  return Boolean(getApiKey());
}
