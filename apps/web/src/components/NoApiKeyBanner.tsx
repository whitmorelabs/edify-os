"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Key, X } from "lucide-react";
import { hasApiKey } from "@/lib/api-key";

const DISMISS_KEY = "edify_api_key_banner_dismissed";

export function NoApiKeyBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if no API key is set. Re-check on every page load.
    if (!hasApiKey()) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  function handleDismiss() {
    setVisible(false);
    // Store dismissal in sessionStorage (not localStorage) so it re-shows next load
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mb-6">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
        <Key className="h-4 w-4 text-amber-600" />
      </div>
      <p className="flex-1 text-sm text-amber-800">
        Connect your Claude API key to start chatting with your team.{" "}
        <Link
          href="/dashboard/admin/ai-config"
          className="font-semibold underline underline-offset-2 hover:text-amber-900 transition-colors"
        >
          Set it up now
        </Link>
      </p>
      <button
        onClick={handleDismiss}
        className="shrink-0 p-1 rounded text-amber-500 hover:text-amber-700 hover:bg-amber-100 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
