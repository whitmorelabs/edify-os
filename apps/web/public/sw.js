/**
 * Edify OS — Minimal PWA Service Worker
 *
 * Strategy:
 *   - App shell + static assets → cache-first (install-time pre-cache)
 *   - /api/* routes           → network-first (never serve stale API data)
 *   - HTML navigation          → stale-while-revalidate (fast load, bg refresh)
 *   - Everything else          → network-first with cache fallback
 *
 * No offline form submission or background sync — out of scope for v1.
 */

const CACHE_VERSION = "edify-pwa-v2";

const APP_SHELL = [
  "/",
  "/dashboard",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

// ── Install: pre-cache the app shell ────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: purge old cache versions ──────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch: routing logic ─────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // API routes: network-first, no caching
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, { cache: false }));
    return;
  }

  // HTML navigation requests: stale-while-revalidate
  if (request.mode === "navigate") {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Static assets (JS, CSS, images, fonts): cache-first
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "image" ||
    request.destination === "font"
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Default: network-first with cache fallback
  event.respondWith(networkFirst(request, { cache: true }));
});

// ── Strategy helpers ─────────────────────────────────────────────────────────

/**
 * Cache-first: serve from cache, fall back to network and update cache.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_VERSION);
    cache.put(request, response.clone());
  }
  return response;
}

/**
 * Stale-while-revalidate: return cached response immediately,
 * then fetch fresh copy in background and update cache.
 *
 * Uses redirect: "manual" so that any server-side redirect produces an
 * opaqueredirect Response, which the browser handles as a real navigation
 * redirect. Returning a redirected Response directly to a navigation
 * FetchEvent causes Chrome to throw ERR_FAILED (well-known SW gotcha).
 * opaqueredirect responses are not cacheable — the Cache API rejects them —
 * so we skip caching them and let the browser follow the redirect natively.
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);

  // Use redirect: "manual" so a redirected navigation produces an opaque-redirect
  // response that the browser handles natively. Returning a redirected response
  // from a SW to a navigation FetchEvent causes Chrome to throw ERR_FAILED.
  const fetchPromise = fetch(request, { redirect: "manual" })
    .then((response) => {
      // Only cache successful, non-opaque responses (opaqueredirect can't be cached)
      if (response.ok && response.type !== "opaqueredirect") {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch((err) => {
      if (cached) return; // bg revalidation failed — cached copy still served
      throw err;          // no cache + no network → propagate so SW doesn't hang
    });

  return cached || fetchPromise;
}

/**
 * Network-first: try network, fall back to cache.
 * @param {{ cache: boolean }} options - whether to cache successful responses
 */
async function networkFirst(request, { cache }) {
  try {
    const response = await fetch(request);
    if (cache && response.ok) {
      const c = await caches.open(CACHE_VERSION);
      c.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw new Error(`Network request failed and no cache available: ${request.url}`);
  }
}
