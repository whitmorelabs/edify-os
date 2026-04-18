import { NextRequest, NextResponse } from "next/server";


const defaultConfigs = [
  {
    slug: "development_director",
    label: "Director of Development",
    enabled: true,
    autonomyLevel: "assisted",
    personaOverrides: "",
  },
  {
    slug: "marketing_director",
    label: "Marketing Director",
    enabled: true,
    autonomyLevel: "suggestion",
    personaOverrides: "",
  },
  {
    slug: "executive_assistant",
    label: "Executive Assistant",
    enabled: true,
    autonomyLevel: "assisted",
    personaOverrides: "",
  },
  {
    slug: "programs_director",
    label: "Programs Director",
    enabled: true,
    autonomyLevel: "suggestion",
    personaOverrides: "",
  },
  {
    slug: "hr_volunteer_coordinator",
    label: "HR & Volunteer Coordinator",
    enabled: false,
    autonomyLevel: "suggestion",
    personaOverrides: "",
  },
  {
    slug: "events_director",
    label: "Events Director",
    enabled: true,
    autonomyLevel: "suggestion",
    personaOverrides: "Always mention our annual gala when discussing donor events.",
  },
];

const providerConfig = {
  provider: "Claude (Anthropic)",
  accessKeySet: true,
  accessKeyPreview: "sk-ant-...xxxx1234",
};

export async function GET() {
  return NextResponse.json({
    archetypes: defaultConfigs,
    provider: providerConfig,
  });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  // Mock — in production this would update the agent_configs table
  return NextResponse.json({ success: true, updated: body });
}
