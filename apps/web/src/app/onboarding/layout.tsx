import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/supabase/server";
import type { ReactNode } from "react";

/**
 * Server layout for /onboarding.
 *
 * Guards:
 * 1. Unauthenticated users → middleware already redirects to /login before this runs.
 * 2. Users who already have a member row → redirect to /dashboard (they've onboarded).
 *
 * Users with no member row pass through to the onboarding page client component.
 */
export default async function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, memberId } = await getAuthContext();

  // If Supabase is not configured (local dev / mock mode), let the page render.
  if (!user) {
    // Middleware should have caught this, but belt-and-suspenders.
    redirect("/login");
  }

  if (memberId) {
    // User already has an org — send them to the dashboard.
    redirect("/dashboard");
  }

  return <>{children}</>;
}
