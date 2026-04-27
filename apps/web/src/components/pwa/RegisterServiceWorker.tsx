"use client";

import { useEffect } from "react";

/**
 * Registers the Edify OS service worker for PWA installability.
 *
 * Placed in the root layout so it runs once on app load across all routes.
 * Renders nothing — purely side-effect.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          if (process.env.NODE_ENV === "development") {
            console.log("[SW] Registered:", registration.scope);
          }
        })
        .catch((error) => {
          console.error("[SW] Registration failed:", error);
        });
    }
  }, []);

  return null;
}
