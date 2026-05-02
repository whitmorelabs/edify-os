/**
 * MCP server catalog — single source of truth for every MCP server Edify can
 * connect to. Adding a new server is (almost always) a config edit here plus,
 * if the server uses OAuth, a per-server quirks module under ./oauth/.
 *
 * Sprint 1 of MCP-0 (2026-05-01): factory pattern bootstrapped with three
 * servers — slack (env-var bearer), canva (OAuth, retained from Sprint 2),
 * and notion (OAuth, the proof connector for the new factory).
 *
 * Post-Sprint-1 add (2026-04-30): asana (OAuth) — first connector wired
 * config-only via the factory. Validated the "config-only new connector"
 * promise from the MCP-0 PRD (no factory or route changes required).
 *
 * Sprint 2 will add: per-org per-archetype grant management, integrations UI
 * polish, observability, and additional servers (Candid, Blackbaud,
 * Benevity). See PRD `MCP-0-PRD-2026-05-01.md` Sections 4–5.
 *
 * NOTE: Storage `server_name` keys (the DB column on mcp_connections) intentionally
 * match the catalog `id` 1:1 so per-org tokens upsert against the same key.
 * The Canva `id` is "canva" — matches the existing CANVA_SERVER_NAME constant.
 */

import type { ArchetypeSlug } from "@/lib/archetypes";

/**
 * How a server's bearer token is obtained at request time.
 *
 *   - "oauth"        — per-org token from mcp_connections, refreshed by oauth-factory
 *   - "bearer-env"   — server-wide bearer pulled from process.env (single-tenant fallback,
 *                       used for Sprint-1-style Slack wiring before per-org OAuth ships)
 *   - "anonymous"    — no auth header sent (rare, public MCP servers)
 */
export type AuthMode = "oauth" | "bearer-env" | "anonymous";

/** OAuth client_credentials transport — how the client authenticates to the token endpoint. */
export type OAuthClientAuth = "basic" | "post";

/**
 * Per-server OAuth quirks. Only relevant when authMode === "oauth".
 *
 * Each property reflects an actual quirk we've encountered across Canva/Notion;
 * keep this list short and avoid invention — extend only when a real new quirk
 * shows up in a future server.
 */
export interface OAuthConfig {
  /** OAuth 2.0 authorize endpoint (where we redirect users to grant consent). */
  authorizeUrl: string;
  /** OAuth 2.0 token endpoint (code exchange + refresh). */
  tokenUrl: string;
  /** Optional revoke endpoint (best-effort cleanup on disconnect). */
  revokeUrl?: string;
  /** How client credentials are sent — Basic header (Canva, Notion) or POST body (Slack-style). */
  clientAuth: OAuthClientAuth;
  /** Whether to use PKCE (S256). Canva requires it; Notion does not. */
  usePkce: boolean;
  /**
   * Space-separated scopes string. Empty if the server uses page-grant model
   * (Notion) or scopes-on-app-side (Slack-when-OAuth).
   */
  scopes?: string;
  /**
   * Extra query params to append to the authorize URL beyond the standard
   * client_id / redirect_uri / response_type=code / scope / state / PKCE.
   * Used for Notion's `owner=user` requirement.
   */
  authorizeExtraParams?: Record<string, string>;
  /**
   * Env var holding the OAuth client_id. Required for "oauth" mode.
   */
  clientIdEnv: string;
  /**
   * Env var holding the OAuth client_secret. Required for "oauth" mode.
   */
  clientSecretEnv: string;
  /**
   * Optional env var override for the redirect_uri. If unset, the factory
   * derives it from getAppOrigin() + the standard generic callback path
   * (`/api/oauth/<id>/callback`).
   */
  redirectUriEnv?: string;
  /**
   * Optional fixed redirect URI override (used by legacy Canva wiring that
   * predates the generic /api/oauth/[server]/callback route). When set, the
   * factory uses this exact path instead of the generic one. New servers
   * should leave this undefined and use the generic callback.
   */
  legacyRedirectPath?: string;
  /**
   * Hook to extract a metadata object from the token-endpoint response that
   * gets stored alongside the encrypted tokens in mcp_connections.metadata.
   * Used to surface things like "connected as <user@workspace>" in the UI.
   * Optional; default is `() => null`.
   */
  metadataFromTokenResponse?: (tokenResponse: Record<string, unknown>) => Record<string, unknown> | null;
}

/**
 * One MCP server in the catalog. The shape is stable across all auth modes —
 * `oauth` is only set when authMode === "oauth".
 */
export interface ServerCatalogEntry {
  /** Stable id, also used as `mcp_connections.server_name` and as the URL slug for /api/oauth/[server]. */
  id: string;
  /** Human-readable display name (used in admin diagnostics, logs). */
  displayName: string;
  /** SSE/HTTP endpoint passed to Anthropic's `mcp_servers` parameter. */
  url: string;
  authMode: AuthMode;
  /** When authMode === "bearer-env", the env var name holding the bearer token. */
  bearerEnv?: string;
  /** When authMode === "oauth", the OAuth config block. */
  oauth?: OAuthConfig;
  /**
   * Which archetypes have this server in scope. The chat path checks this list
   * to decide whether to include the server in `mcp_servers` for the turn.
   *
   * Per-org / per-archetype grant management (admin can disable a server for
   * a specific archetype) is Sprint 2 — this static list is the default scope.
   */
  archetypes: ArchetypeSlug[];
  /**
   * Optional gate: when set, the catalog entry is silently dropped from runtime
   * resolution if the named env var is unset. Used for servers whose stable
   * production URL is gated behind an env var (Canva today; future per-deploy
   * overrides).
   */
  urlEnvGate?: string;
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

/**
 * Slack — Sprint 1 of MCP wiring used a single env-var bearer token. Sprint 2 of
 * MCP-0 (per PRD Sections 4–5) will move Slack to per-org OAuth via the factory.
 * For Sprint 1 of MCP-0 we keep the env-var path so existing behavior is preserved.
 */
const SLACK_ENTRY: ServerCatalogEntry = {
  id: "slack",
  displayName: "Slack",
  // See https://github.com/anthropics/knowledge-work-plugins for the MCP URL list.
  url: "https://mcp.slack.com/sse",
  authMode: "bearer-env",
  bearerEnv: "SLACK_MCP_OAUTH_TOKEN",
  archetypes: ["marketing_director"],
};

/**
 * Canva — per-org OAuth via mcp_connections, retained from MCP-0 Sprint 2.
 *
 * Auth quirks (locked-in from canva-oauth.ts):
 *   - HTTP Basic for client credentials at the token endpoint
 *   - PKCE (S256) on the authorize step
 *   - Single-use refresh tokens — the factory defensively persists any new
 *     refresh_token returned by the token endpoint
 *   - Scopes are NOT cumulative — each must be re-listed on every authorize call
 *
 * Legacy redirect path: Canva ships through /api/integrations/canva/callback,
 * not the generic /api/oauth/canva/callback. Set legacyRedirectPath so the
 * factory hands existing Canva wiring back its own URL.
 */
const CANVA_ENTRY: ServerCatalogEntry = {
  id: "canva",
  displayName: "Canva",
  url: process.env.CANVA_MCP_URL ?? "",
  urlEnvGate: "CANVA_MCP_URL", // server entry skipped if unset (Canva has no stable production URL yet)
  authMode: "oauth",
  archetypes: ["marketing_director"],
  oauth: {
    authorizeUrl: "https://www.canva.com/api/oauth/authorize",
    tokenUrl: "https://api.canva.com/rest/v1/oauth/token",
    revokeUrl: "https://api.canva.com/rest/v1/oauth/revoke",
    clientAuth: "basic",
    usePkce: true,
    scopes: [
      "design:content:read",
      "design:content:write",
      "asset:read",
      "asset:write",
      "profile:read",
    ].join(" "),
    clientIdEnv: "CANVA_OAUTH_CLIENT_ID",
    clientSecretEnv: "CANVA_OAUTH_CLIENT_SECRET",
    redirectUriEnv: "CANVA_OAUTH_REDIRECT_URI",
    legacyRedirectPath: "/api/integrations/canva/callback",
  },
};

/**
 * Notion — proof connector for MCP-0 Sprint 1. Public integration OAuth flow,
 * Basic-auth for client credentials, NO PKCE, requires `owner=user` query param,
 * refresh_token rotates on each use. See:
 *   https://developers.notion.com/docs/authorization
 *   https://developers.notion.com/guides/get-started/authorization
 *
 * Connector metadata (workspace_id, workspace_name, bot_id, owner) is harvested
 * from the token-endpoint response and stored in mcp_connections.metadata so the
 * UI can show "Connected to <workspace_name>".
 */
const NOTION_ENTRY: ServerCatalogEntry = {
  id: "notion",
  displayName: "Notion",
  url: "https://mcp.notion.com/mcp",
  authMode: "oauth",
  // Per memory project_edify_archetype_roadmap: Notion's near-term scope is
  // EA, Development Director, and Programs Director.
  archetypes: ["executive_assistant", "development_director", "programs_director"],
  oauth: {
    authorizeUrl: "https://api.notion.com/v1/oauth/authorize",
    tokenUrl: "https://api.notion.com/v1/oauth/token",
    clientAuth: "basic",
    usePkce: false,
    // Notion does not use OAuth scopes — capabilities are conveyed by
    // page-level grants the user picks at consent time. Leave scopes undefined.
    authorizeExtraParams: { owner: "user" },
    clientIdEnv: "NOTION_OAUTH_CLIENT_ID",
    clientSecretEnv: "NOTION_OAUTH_CLIENT_SECRET",
    redirectUriEnv: "NOTION_OAUTH_REDIRECT_URI",
    metadataFromTokenResponse: (resp) => {
      const workspaceId = typeof resp.workspace_id === "string" ? resp.workspace_id : null;
      const workspaceName = typeof resp.workspace_name === "string" ? resp.workspace_name : null;
      const botId = typeof resp.bot_id === "string" ? resp.bot_id : null;
      // Owner can be either a user object or a workspace owner; we pull the
      // person's name + email if present so the UI can display "connected as".
      const owner = resp.owner as Record<string, unknown> | undefined;
      const ownerUser = owner?.user as Record<string, unknown> | undefined;
      const ownerPerson = ownerUser?.person as Record<string, unknown> | undefined;
      const email = typeof ownerPerson?.email === "string" ? ownerPerson.email : null;
      const name = typeof ownerUser?.name === "string" ? ownerUser.name : null;
      return {
        notion_workspace_id: workspaceId,
        notion_workspace_name: workspaceName,
        notion_bot_id: botId,
        notion_user_email: email,
        notion_user_name: name,
      };
    },
  },
};

/**
 * Asana — second OAuth connector wired through the MCP-0 factory (post-Sprint 1).
 *
 * URL: Asana shipped a V2 MCP server (`https://mcp.asana.com/v2/mcp`) and is
 * deprecating the V1 SSE endpoint (`https://mcp.asana.com/sse`) on 2026-05-11.
 * We use V2 from day one to avoid an immediate URL migration.
 *
 * Auth quirks (per https://developers.asana.com/docs/oauth and the MCP integration guide):
 *   - Form-body client credentials (NOT Basic) at the token endpoint
 *   - PKCE (S256) supported on the authorize step — we opt in for defense-in-depth
 *     even though it's not strictly required for confidential clients
 *   - Refresh tokens are long-lived (do NOT rotate per use), unlike Notion/Canva.
 *     The factory always defensively persists any refresh_token returned, so
 *     this difference is invisible at runtime.
 *   - MCP apps require the `resource=https://mcp.asana.com/v2` query param on
 *     authorize, AND scopes MUST be omitted entirely (per Asana MCP docs:
 *     "MCP apps don't require specific scopes—remove the `scope` parameter")
 *   - Token response includes a `data` object with the connecting user's
 *     name/email/gid that we surface as connection metadata.
 *
 * Per memory project_edify_archetype_roadmap (2026-04-20), Asana is on the
 * roadmap for Events Director (event project management). We additionally scope
 * it to Programs Director (program work tracking) and Executive Assistant
 * (cross-team project visibility) — the same multi-archetype-per-server pattern
 * the PRD recommends in §1.
 */
const ASANA_ENTRY: ServerCatalogEntry = {
  id: "asana",
  displayName: "Asana",
  url: "https://mcp.asana.com/v2/mcp",
  authMode: "oauth",
  archetypes: ["events_director", "programs_director", "executive_assistant"],
  oauth: {
    authorizeUrl: "https://app.asana.com/-/oauth_authorize",
    tokenUrl: "https://app.asana.com/-/oauth_token",
    revokeUrl: "https://app.asana.com/-/oauth_revoke",
    // Asana documents form-body POST for client credentials at the token endpoint.
    clientAuth: "post",
    usePkce: true,
    // IMPORTANT: scopes intentionally undefined. Asana MCP docs explicitly
    // require omitting the `scope` param entirely; capabilities are inherited
    // from the connecting user's existing Asana workspace permissions.
    authorizeExtraParams: { resource: "https://mcp.asana.com/v2" },
    clientIdEnv: "ASANA_OAUTH_CLIENT_ID",
    clientSecretEnv: "ASANA_OAUTH_CLIENT_SECRET",
    redirectUriEnv: "ASANA_OAUTH_REDIRECT_URI",
    metadataFromTokenResponse: (resp) => {
      // Asana token response carries `data: { id, gid, name, email }` for the
      // connecting user. Surface it so the integrations UI can show the
      // connected account.
      const data = resp.data as Record<string, unknown> | undefined;
      const gid = typeof data?.gid === "string" ? data.gid : null;
      const name = typeof data?.name === "string" ? data.name : null;
      const email = typeof data?.email === "string" ? data.email : null;
      return {
        asana_user_gid: gid,
        asana_user_name: name,
        asana_user_email: email,
      };
    },
  },
};

/** Catalog keyed by id. Order doesn't matter — buildMcpServersForOrg sorts by archetype. */
export const SERVER_CATALOG: Record<string, ServerCatalogEntry> = {
  [SLACK_ENTRY.id]: SLACK_ENTRY,
  [CANVA_ENTRY.id]: CANVA_ENTRY,
  [NOTION_ENTRY.id]: NOTION_ENTRY,
  [ASANA_ENTRY.id]: ASANA_ENTRY,
};

/** Lookup helper — returns null for unknown ids so callers can 404 cleanly. */
export function getServerEntry(id: string): ServerCatalogEntry | null {
  return SERVER_CATALOG[id] ?? null;
}

/**
 * All server entries that include a given archetype in their scope. Used by
 * buildMcpServersForOrg to decide which servers to resolve at request time.
 *
 * Skips entries gated by an unset env var (e.g., Canva when CANVA_MCP_URL is empty).
 */
export function listServersForArchetype(archetype: ArchetypeSlug): ServerCatalogEntry[] {
  return Object.values(SERVER_CATALOG).filter((entry) => {
    if (!entry.archetypes.includes(archetype)) return false;
    if (entry.urlEnvGate && !process.env[entry.urlEnvGate]) return false;
    if (!entry.url) return false;
    return true;
  });
}
