// Types for the heartbeat / check-in system

export type ArchetypeSlug =
  | "development_director"
  | "marketing_director"
  | "executive_assistant"
  | "programs_director"
  | "hr_volunteer_coordinator"
  | "events_director";

export interface HeartbeatConfig {
  archetype: ArchetypeSlug;
  enabled: boolean;
  /** How often to check in, in hours. Use 24 for "once daily". */
  frequencyHours: 1 | 2 | 4 | 8 | 24;
  /** 24-hour clock hour when check-ins start (e.g., 8 = 8 AM) */
  activeHoursStart: number;
  /** 24-hour clock hour when check-ins end (e.g., 20 = 8 PM) */
  activeHoursEnd: number;
}

export interface OrgHeartbeatSettings {
  enabled: boolean;
  timezone: string;
  emailDigest: boolean;
  digestTime: string; // "HH:MM"
  archetypes: Record<ArchetypeSlug, HeartbeatConfig>;
}

export interface HeartbeatResult {
  id: string;
  archetype: ArchetypeSlug;
  /** ISO 8601 timestamp. Matches backend field `created_at`. */
  timestamp: string;
  status: "completed" | "skipped" | "error";
  title: string | null;
  body: string | null;
  suggestedAction: string | null;
  suggestedActionUrl?: string;
  skipReason?: string;
}

// ---------------------------------------------------------------------------
// Mock fallback data (used when API is unavailable in development)
// ---------------------------------------------------------------------------

const MOCK_CONFIG: OrgHeartbeatSettings = {
  enabled: true,
  timezone: "America/New_York",
  emailDigest: false,
  digestTime: "08:00",
  archetypes: {
    development_director: {
      archetype: "development_director",
      enabled: true,
      frequencyHours: 4,
      activeHoursStart: 8,
      activeHoursEnd: 20,
    },
    marketing_director: {
      archetype: "marketing_director",
      enabled: true,
      frequencyHours: 4,
      activeHoursStart: 8,
      activeHoursEnd: 20,
    },
    executive_assistant: {
      archetype: "executive_assistant",
      enabled: true,
      frequencyHours: 2,
      activeHoursStart: 8,
      activeHoursEnd: 18,
    },
    programs_director: {
      archetype: "programs_director",
      enabled: false,
      frequencyHours: 8,
      activeHoursStart: 9,
      activeHoursEnd: 17,
    },
    hr_volunteer_coordinator: {
      archetype: "hr_volunteer_coordinator",
      enabled: false,
      frequencyHours: 24,
      activeHoursStart: 9,
      activeHoursEnd: 17,
    },
    events_director: {
      archetype: "events_director",
      enabled: false,
      frequencyHours: 8,
      activeHoursStart: 9,
      activeHoursEnd: 17,
    },
  },
};

// ---------------------------------------------------------------------------
// API wrapper functions
// ---------------------------------------------------------------------------

export async function getHeartbeatConfig(): Promise<OrgHeartbeatSettings> {
  try {
    const res = await fetch("/api/heartbeat", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch config");
    return res.json();
  } catch {
    return MOCK_CONFIG;
  }
}

export async function updateArchetypeConfig(
  archetype: ArchetypeSlug,
  config: Partial<HeartbeatConfig>
): Promise<HeartbeatConfig> {
  try {
    const res = await fetch("/api/heartbeat", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archetype, config }),
    });
    if (!res.ok) throw new Error("Failed to update config");
    const updated: OrgHeartbeatSettings = await res.json();
    return updated.archetypes[archetype];
  } catch {
    return { ...MOCK_CONFIG.archetypes[archetype], ...config };
  }
}

export async function toggleAllHeartbeats(
  enabled: boolean
): Promise<OrgHeartbeatSettings> {
  try {
    const res = await fetch("/api/heartbeat", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    if (!res.ok) throw new Error("Failed to toggle check-ins");
    return res.json();
  } catch {
    return { ...MOCK_CONFIG, enabled };
  }
}

export async function getHeartbeatHistory(
  archetype?: ArchetypeSlug
): Promise<HeartbeatResult[]> {
  try {
    const url = archetype
      ? `/api/heartbeat/history?archetype=${archetype}`
      : "/api/heartbeat/history";
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch history");
    return res.json();
  } catch {
    return [];
  }
}

export async function triggerHeartbeat(
  archetype: ArchetypeSlug
): Promise<HeartbeatResult> {
  const res = await fetch("/api/heartbeat/trigger", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ archetype }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error((err as { error?: string }).error ?? "Failed to trigger heartbeat");
  }
  return res.json() as Promise<HeartbeatResult>;
}
