import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Returns true when the Supabase env vars are present.
 * Used to gracefully skip auth operations in pure dev/mock mode.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

/**
 * Browser-side Supabase client for use in 'use client' components.
 * Returns null when Supabase is not configured (dev/mock mode).
 */
export function createClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  return createBrowserClient(supabaseUrl!, supabaseAnonKey!);
}
