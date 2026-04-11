import { NextResponse } from "next/server";
import type { OrgHeartbeatSettings } from "@/app/dashboard/inbox/heartbeats";

// Default config — single source of truth for the mock API layer.
// Archetypes mirror the canonical backend slugs.
const defaultConfig: OrgHeartbeatSettings = {
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
    finance_director: {
      archetype: "finance_director",
      enabled: true,
      frequencyHours: 24,
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

// In-memory store for mock persistence within the process lifetime
let mockConfig = { ...defaultConfig };

export async function GET() {
  return NextResponse.json(mockConfig);
}

export async function PATCH(request: Request) {
  const body = await request.json();

  if (body.enabled !== undefined) {
    mockConfig.enabled = body.enabled;
  }
  if (body.timezone !== undefined) {
    mockConfig.timezone = body.timezone;
  }
  if (body.emailDigest !== undefined) {
    mockConfig.emailDigest = body.emailDigest;
  }
  if (body.digestTime !== undefined) {
    mockConfig.digestTime = body.digestTime;
  }
  if (body.archetype && body.config) {
    mockConfig.archetypes[body.archetype as keyof typeof mockConfig.archetypes] = {
      ...mockConfig.archetypes[body.archetype as keyof typeof mockConfig.archetypes],
      ...body.config,
    };
  }

  return NextResponse.json(mockConfig);
}
