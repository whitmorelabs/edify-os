"use client";

/**
 * CanvaIntegrationCard
 *
 * Displays Canva connection status for the current org and provides
 * Connect / Disconnect actions.
 *
 * Design constraints (Citlali's rule):
 *   - Uses only existing primitives: card, btn-primary, btn-ghost CSS classes
 *     matching the patterns in globals.css, plus the Badge primitive.
 *   - No new colors, no new fonts, no new tokens.
 *   - Typography follows existing patterns (heading-3, text-fg-3, label, etc.)
 */

import { useState, useEffect, useCallback } from "react";
import { CheckCircle, ExternalLink, Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CanvaStatus {
  connected: boolean;
  email: string | null;
}

export function CanvaIntegrationCard() {
  const [status, setStatus] = useState<CanvaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    kind: "success" | "error";
  } | null>(null);

  // Auto-dismiss toast after 5s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/integrations/canva");
      if (!res.ok) return;
      const data = (await res.json()) as CanvaStatus;
      setStatus(data);
    } catch {
      // Non-fatal — show as disconnected
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Read ?canva= query param on mount (redirect back from OAuth callback)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const canvaParam = params.get("canva");
    if (canvaParam === "connected") {
      setToast({ message: "Canva connected successfully!", kind: "success" });
      // Refresh status and strip param from URL
      loadStatus();
      const url = new URL(window.location.href);
      url.searchParams.delete("canva");
      url.searchParams.delete("reason");
      window.history.replaceState({}, "", url.toString());
    } else if (canvaParam === "denied") {
      const reason = params.get("reason") ?? "unknown_error";
      setToast({
        message: `Canva connection was not completed (${reason}). Please try again.`,
        kind: "error",
      });
      const url = new URL(window.location.href);
      url.searchParams.delete("canva");
      url.searchParams.delete("reason");
      window.history.replaceState({}, "", url.toString());
    }
  }, [loadStatus]);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/integrations/canva/disconnect", {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setToast({
          message: body.error ?? "Failed to disconnect Canva. Please try again.",
          kind: "error",
        });
        return;
      }
      setStatus({ connected: false, email: null });
      setToast({ message: "Canva disconnected.", kind: "success" });
    } catch {
      setToast({ message: "Failed to disconnect Canva. Please try again.", kind: "error" });
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg text-sm font-medium animate-slide-up ${
            toast.kind === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.kind === "success" ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <X className="h-4 w-4 shrink-0" />
          )}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 opacity-75 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Card */}
      <div className="card p-5">
        {/* Top row: logo + title + category badge */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Canva logo mark — inline SVG so no external image dependency */}
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(0,196,156,0.15)]">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"
                  fill="#00C49C"
                />
                <path
                  d="M15.5 8.5c-.828 0-1.5.672-1.5 1.5 0 .414.168.79.44 1.06l-2.44 2.44c-.27-.272-.646-.44-1.06-.44-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5c.414 0 .79-.168 1.06-.44l2.44 2.44c-.272.27-.44.646-.44 1.06 0 .828.672 1.5 1.5 1.5s1.5-.672 1.5-1.5-.672-1.5-1.5-1.5c-.414 0-.79.168-1.06.44L12 16.12l-2.44-2.44c.272-.27.44-.646.44-1.06 0-.828-.672-1.5-1.5-1.5s-1.5.672-1.5 1.5.672 1.5 1.5 1.5c.414 0 .79-.168 1.06-.44l2.44-2.44c-.272-.27-.44-.646-.44-1.06 0-.828.672-1.5 1.5-1.5z"
                  fill="white"
                  opacity="0.9"
                />
              </svg>
            </span>
            <span className="font-semibold text-fg-1">Canva</span>
          </div>
          <Badge tone="brand">Marketing</Badge>
        </div>

        {/* Description */}
        <p className="mt-3 text-sm text-fg-3">
          Connect Canva so Kida (your Marketing Director) can create, read, and manage
          designs on your behalf — flyers, social graphics, presentations, and more.
        </p>

        {/* Capabilities */}
        <div className="mt-3 space-y-1">
          {[
            "Create and edit designs on your behalf",
            "Upload brand assets (images, logos)",
            "Read existing design metadata",
          ].map((cap) => (
            <div key={cap} className="flex items-center gap-1.5 text-xs text-fg-3">
              <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
              {cap}
            </div>
          ))}
        </div>

        {/* Status + action footer */}
        <div className="mt-4 flex items-center gap-2">
          {loading ? (
            <span className="flex items-center gap-2 text-sm text-fg-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking connection...
            </span>
          ) : status?.connected ? (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Connected
              </span>
              {status.email && (
                <span className="text-xs text-fg-4 truncate max-w-[160px]">
                  {status.email}
                </span>
              )}
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="btn-ghost ml-auto text-xs text-red-400 hover:text-red-300 px-3 py-1.5 disabled:opacity-50"
              >
                {disconnecting ? "Disconnecting..." : "Disconnect"}
              </button>
            </>
          ) : (
            <a
              href="/api/integrations/canva/connect"
              className="btn-primary w-full text-sm flex items-center justify-center gap-2"
            >
              Connect Canva
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>

        {/* MCP status note */}
        <p className="mt-3 text-[11px] text-fg-4">
          Canva MCP is in preview. OAuth tokens are stored encrypted. The live MCP
          endpoint will activate once Canva publishes a production SSE URL.
        </p>
      </div>
    </>
  );
}
