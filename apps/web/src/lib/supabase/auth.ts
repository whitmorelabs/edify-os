import { createClient } from "./client";

/**
 * Auth helper functions for Edify OS.
 * All functions gracefully return an error when Supabase is not configured
 * so the UI can surface meaningful feedback in dev/mock mode.
 */

function notConfigured() {
  return { data: null, error: new Error("Supabase is not configured") };
}

/**
 * Sign in with email and password.
 */
export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient();
  if (!supabase) return notConfigured();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

/**
 * Create a new account and set up the user's org.
 *
 * The org row is created via a server-side API route after sign-up because
 * the service-role key should never be exposed to the browser.
 */
export async function signUp(
  email: string,
  password: string,
  orgName: string
) {
  const supabase = createClient();
  if (!supabase) return notConfigured();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Pass orgName in metadata so the server-side webhook / route can pick it up.
      data: { org_name: orgName },
    },
  });

  return { data, error };
}

/**
 * Sign the current user out and clear the session.
 */
export async function signOut() {
  const supabase = createClient();
  if (!supabase) return notConfigured();

  const { error } = await supabase.auth.signOut();
  return { data: null, error };
}

/**
 * Get the current session (JWT + user). Returns null when unauthenticated.
 */
export async function getSession() {
  const supabase = createClient();
  if (!supabase) return notConfigured();

  const { data, error } = await supabase.auth.getSession();
  return { data, error };
}

/**
 * Initiate Google OAuth sign-in via Supabase.
 * Redirects the browser to Google's OAuth consent screen.
 * After the user grants permission, Google redirects to /auth/callback.
 */
export async function signInWithGoogle() {
  const supabase = createClient();
  if (!supabase) return notConfigured();

  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : undefined;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        // Force account selection so users can switch Google accounts
        prompt: "select_account",
      },
    },
  });

  return { data, error };
}

/**
 * Send a password-reset email to the given address.
 */
export async function resetPassword(email: string) {
  const supabase = createClient();
  if (!supabase) return notConfigured();

  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/login`
      : undefined;

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  return { data, error };
}
