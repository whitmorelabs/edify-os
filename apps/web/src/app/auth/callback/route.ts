import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * GET /auth/callback
 *
 * Supabase redirects here after a successful Google OAuth sign-in.
 * Exchanges the authorization code for a session and sets the auth cookie.
 * Then redirects the user to the dashboard (or a redirectTo param if set).
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  const origin = requestUrl.origin;

  if (!code) {
    // No code means something went wrong on the OAuth provider's side
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    // Supabase not configured — should not happen in production
    return NextResponse.redirect(`${origin}/login?error=not_configured`);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession error:", error.message);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
  }

  // Successful sign-in — redirect to dashboard (or wherever they were headed)
  return NextResponse.redirect(`${origin}${next}`);
}
