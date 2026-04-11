"use client";

import { useEffect, useState } from "react";
import { createClient } from "./client";
import type { User } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Types matching the DB schema in supabase/migrations/00001_core_tenancy.sql
// ---------------------------------------------------------------------------

export interface Org {
  id: string;
  name: string;
  slug: string;
  mission: string | null;
  website: string | null;
  timezone: string;
  autonomy_level: "suggestion" | "assisted" | "autonomous";
  onboarding_completed_at: string | null;
  plan: "free" | "starter" | "pro" | "enterprise";
  ai_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  org_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  slack_user_id: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// useUser
// ---------------------------------------------------------------------------

interface UseUserResult {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Returns the current authenticated user, a loading flag, and any error.
 * Returns { user: null } immediately when Supabase is not configured.
 */
export function useUser(): UseUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const supabase = createClient();

    if (!supabase) {
      setLoading(false);
      return;
    }

    // Fetch initial session
    supabase.auth.getUser().then(({ data, error: err }) => {
      if (err) setError(err);
      else setUser(data.user);
      setLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading, error };
}

// ---------------------------------------------------------------------------
// useOrg
// ---------------------------------------------------------------------------

interface UseOrgResult {
  org: Org | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Returns the org that the current user belongs to.
 * Fetches from members -> orgs join using RLS (user sees only their own org).
 * Returns { org: null } when unauthenticated or Supabase is not configured.
 */
export function useOrg(): UseOrgResult {
  const { user, loading: userLoading } = useUser();
  const [org, setOrg] = useState<Org | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (userLoading) return;

    if (!user) {
      setOrg(null);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase
      .from("members")
      .select("org_id, orgs(*)")
      .eq("user_id", user.id)
      .single()
      .then(({ data, error: err }) => {
        if (err) {
          setError(new Error(err.message));
        } else if (data?.orgs) {
          // orgs is returned as an object when using single()
          setOrg(data.orgs as unknown as Org);
        }
        setLoading(false);
      });
  }, [user, userLoading]);

  return { org, loading, error };
}

// ---------------------------------------------------------------------------
// useMembers
// ---------------------------------------------------------------------------

interface UseMembersResult {
  members: Member[];
  loading: boolean;
  error: Error | null;
}

/**
 * Returns all members of the current user's org.
 * Respects RLS — users only see members within the same org.
 * Returns { members: [] } when unauthenticated or Supabase is not configured.
 */
export function useMembers(): UseMembersResult {
  const { org, loading: orgLoading } = useOrg();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (orgLoading) return;

    if (!org) {
      setMembers([]);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase
      .from("members")
      .select("*")
      .eq("org_id", org.id)
      .then(({ data, error: err }) => {
        if (err) {
          setError(new Error(err.message));
        } else {
          setMembers((data as Member[]) ?? []);
        }
        setLoading(false);
      });
  }, [org, orgLoading]);

  return { members, loading, error };
}
