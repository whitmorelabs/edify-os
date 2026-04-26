/**
 * /dashboard/settings/integrations
 *
 * MCP Integrations settings page — lists per-org OAuth connections that
 * power the archetype MCP servers (Canva for Marketing Director, etc.).
 *
 * This page is distinct from /dashboard/integrations which is the broad
 * "Connected accounts" catalog (Google, Composio social, CRM, etc.).
 * This page is specifically for MCP server connections that require
 * Edify-mediated OAuth to attach tokens to Anthropic API calls.
 *
 * Layout follows the existing /dashboard/settings/* pattern:
 *   - max-w-3xl container, space-y-8, animate-fade-in
 *   - card p-6 sections with icon + heading + description headers
 *   - btn-secondary for sub-page links, consistent typography tokens
 *
 * Sprint 2: Canva only. Future integrations (Figma, Notion, etc.) can be
 * added as additional cards following the same layout.
 */

import { ArrowLeft, Plug } from "lucide-react";
import Link from "next/link";
import { CanvaIntegrationCard } from "@/components/integrations/CanvaIntegrationCard";

export default function IntegrationsSettingsPage() {
  return (
    <div className="max-w-3xl space-y-8 animate-fade-in">
      {/* Back link */}
      <Link
        href="/dashboard/settings"
        className="inline-flex items-center gap-1.5 text-sm text-fg-3 hover:text-fg-1 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Settings
      </Link>

      {/* Page header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/15">
            <Plug className="h-5 w-5 text-brand-500" />
          </div>
          <h1 className="heading-1">MCP Integrations</h1>
        </div>
        <p className="text-fg-3 text-sm">
          Connect accounts that your AI team members use as live tools — not just data
          references, but actual actions like creating a Canva design mid-conversation.
          These connections are stored per-organization and passed securely to the AI
          when it needs them.
        </p>
      </div>

      {/* Section: Design Tools */}
      <div className="space-y-4">
        <h2 className="heading-3 text-fg-2">Design Tools</h2>
        <CanvaIntegrationCard />
      </div>

      {/* Placeholder: future integrations */}
      <div className="card p-5 border-dashed opacity-60">
        <p className="text-sm font-medium text-fg-2">More coming soon</p>
        <p className="mt-1 text-xs text-fg-4">
          Figma, Notion, and other MCP-compatible tools will appear here as they are
          wired up.
        </p>
      </div>
    </div>
  );
}
