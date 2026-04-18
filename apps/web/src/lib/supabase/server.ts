import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Builds the Anthropic key columns for an org row.
 * Pass validated=true when the key has just been confirmed live (org create).
 * Pass validated=false for lazy validation on first use (settings PATCH).
 */
export function buildAnthropicKeyPayload(
  plaintextKey: string | null | undefined,
  validated: boolean
) {
  if (!plaintextKey) {
    return {
      anthropic_api_key_encrypted: null,
      anthropic_api_key_set_at: null,
      anthropic_api_key_valid: false,
      anthropic_api_key_hint: null,
    };
  }
  return {
    anthropic_api_key_encrypted: plaintextKey,
    anthropic_api_key_set_at: new Date().toISOString(),
    anthropic_api_key_valid: validated,
    anthropic_api_key_hint: plaintextKey.slice(-4),
  };
}

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Service-role Supabase client — bypasses RLS, server-side only.
 * Use only in API routes where you need to act on behalf of an authenticated user
 * but need to query across org boundaries (e.g., to look up their org_id from user_id).
 * NEVER expose this client or its queries to the browser.
 */
export function createServiceRoleClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }
  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Get the authenticated user and their org membership in one call.
 * Returns null for both if the user is not authenticated or Supabase is not configured.
 *
 * Usage in API routes:
 *   const { user, orgId, memberId } = await getAuthContext();
 *   if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 */
export async function getAuthContext(): Promise<{
  user: { id: string; email?: string } | null;
  orgId: string | null;
  memberId: string | null;
}> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { user: null, orgId: null, memberId: null };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, orgId: null, memberId: null };

  // Look up the user's org membership (take first org — multi-org support is future work)
  const serviceClient = createServiceRoleClient();
  if (!serviceClient) return { user, orgId: null, memberId: null };

  const { data: member } = await serviceClient
    .from("members")
    .select("id, org_id")
    .eq("user_id", user.id)
    .single();

  return {
    user,
    orgId: member?.org_id ?? null,
    memberId: member?.id ?? null,
  };
}

/**
 * Server-side Supabase client for use in Server Components and Route Handlers.
 * Reads cookies to maintain the user's session.
 * Returns null when Supabase is not configured (dev/mock mode).
 */
export async function createServerSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options?: CookieOptions }[]
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll called from a Server Component where cookies cannot be set.
          // Safe to ignore — the middleware handles session refresh.
        }
      },
    },
  });
}
