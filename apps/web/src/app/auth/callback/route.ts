import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabase/server";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * GET /auth/callback
 *
 * Supabase redirects here after a successful Google OAuth sign-in.
 * Exchanges the authorization code for a session and sets the auth cookie.
 *
 * After sign-in, checks whether the user already has a members row:
 *   - If yes → redirect to /dashboard (existing user)
 *   - If no  → redirect to /onboarding (brand-new user, no org yet)
 *
 * The `next` query param is honoured only when the user already has a member row,
 * so a brand-new user always lands on /onboarding regardless of the original URL.
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

  // Resolve the user identity from the freshly-set session.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check whether this user already has an org membership.
  // Use service client to bypass RLS (user is authenticated but may have no member row).
  if (user) {
    const serviceClient = createServiceRoleClient();
    if (serviceClient) {
      const { data: member } = await serviceClient
        .from("members")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!member) {
        // Brand-new user — send them to onboarding to create their org.
        return NextResponse.redirect(`${origin}/onboarding`);
      }
    }
  }

  // Existing user with a member row — send them to their intended destination.
  return NextResponse.redirect(`${origin}${next}`);
}
