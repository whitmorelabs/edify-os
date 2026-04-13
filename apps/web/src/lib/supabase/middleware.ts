import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Refreshes the Supabase session on every request and returns the response
 * with updated auth cookies. Call this from Next.js middleware.
 *
 * Returns { response, session } where session may be null if unauthenticated
 * or if Supabase is not configured.
 */
export async function updateSession(request: NextRequest) {
  // When Supabase isn't configured, pass through without auth checks.
  if (!supabaseUrl || !supabaseAnonKey) {
    return { response: NextResponse.next({ request }), session: null };
  }

  // Start with a passthrough response so we can attach cookies to it.
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        // Mirror cookies onto the request (so Server Components can read them)
        // and onto the response (so the browser stores them).
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: Do not add logic between createServerClient and getUser().
  // A simple mistake here could make it very hard to debug session issues.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response: supabaseResponse, session: user ? { user } : null };
}
