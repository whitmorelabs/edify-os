import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Routes that require authentication (but do NOT require a member row).
// /onboarding is intentionally here — new users need to be signed in but haven't
// created an org yet, so they must not be bounced for lacking a member row.
const PROTECTED_PREFIXES = ["/dashboard", "/onboarding"];

// Auth routes that logged-in users should be redirected away from
const AUTH_PATHS = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isConfigured = Boolean(
    (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      (process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );

  if (!isConfigured) {
    return NextResponse.next();
  }

  const { response, session } = await updateSession(request);

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  // Allow demo mode to bypass auth on protected routes.
  const isDemoMode =
    request.cookies.get("edify_demo")?.value === "true" ||
    request.nextUrl.searchParams.get("demo") === "true";

  if (isDemoMode && isProtected) {
    if (request.nextUrl.searchParams.get("demo") === "true") {
      const resp = NextResponse.next();
      resp.cookies.set("edify_demo", "true", { path: "/", maxAge: 60 * 60 * 24 }); // 24h
      return resp;
    }
    return NextResponse.next();
  }

  // Redirect unauthenticated users away from protected routes.
  if (isProtected && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect logged-in users away from login/signup to the dashboard.
  if (session && AUTH_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image  (image optimization)
     * - favicon.ico
     * - public assets (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
