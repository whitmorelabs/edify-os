"use client";

import { useState, useEffect, useCallback } from "react";
import type { ArchetypeNamesMap } from "@/app/api/members/archetype-names/route";

interface UseArchetypeNamesReturn {
  names: ArchetypeNamesMap;
  loading: boolean;
  /**
   * Update a single archetype's custom name.
   * Pass null or empty string to clear the name.
   */
  updateName: (slug: string, name: string | null) => Promise<void>;
  /** Refetch names from the server */
  refetch: () => Promise<void>;
}

/**
 * Hook that fetches the current user's custom archetype names once on mount
 * and provides an updateName helper that PATCHes the API and refreshes local state.
 */
export function useArchetypeNames(): UseArchetypeNamesReturn {
  const [names, setNames] = useState<ArchetypeNamesMap>({});
  const [loading, setLoading] = useState(true);

  const fetchNames = useCallback(async () => {
    try {
      const res = await fetch("/api/members/archetype-names");
      if (res.ok) {
        const data = await res.json() as ArchetypeNamesMap;
        setNames(data);
      }
    } catch {
      // Non-fatal — fall back to empty map (default role titles everywhere)
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNames();
  }, [fetchNames]);

  const updateName = useCallback(async (slug: string, name: string | null) => {
    const res = await fetch("/api/members/archetype-names", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, name }),
    });
    if (res.ok) {
      const updated = await res.json() as ArchetypeNamesMap;
      setNames(updated);
    } else {
      const err = await res.json().catch(() => ({ error: "Unknown error" })) as { error: string };
      throw new Error(err.error ?? "Failed to update name");
    }
  }, []);

  return {
    names,
    loading,
    updateName,
    refetch: fetchNames,
  };
}
