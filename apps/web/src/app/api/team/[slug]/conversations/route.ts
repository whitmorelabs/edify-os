import { NextResponse } from "next/server";
import type { ArchetypeSlug } from "@/app/dashboard/inbox/heartbeats";

// In-memory store for mock conversations (per process lifetime)
// In production this will be replaced by a real DB call
const conversationStore: Record<string, ConversationRecord[]> = {};

interface ConversationRecord {
  id: string;
  slug: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

function getDefaultConversations(slug: ArchetypeSlug): ConversationRecord[] {
  const titles: Record<string, string[]> = {
    development_director: [
      "Spring fundraising campaign strategy",
      "Ford Foundation grant LOI",
    ],
    marketing_director: [
      "Annual Impact Report content plan",
      "Social media calendar — Q2",
    ],
    executive_assistant: [
      "May gala scheduling conflicts",
      "Board meeting prep",
    ],
    programs_director: [
      "Q1 outcome data review",
      "Summer program expansion",
    ],
    finance_director: [
      "March budget variance",
      "Cash flow through Q3",
    ],
    hr_volunteer_coordinator: [
      "Volunteer coordinator hiring",
      "Certification renewal tracking",
    ],
    events_director: [
      "May 15th gala checklist",
      "Sponsorship pipeline review",
    ],
  };

  const slugTitles = titles[slug] ?? ["General conversation"];

  const now = new Date();
  return slugTitles.map((title, i) => ({
    id: `mock-conv-${slug}-${i}`,
    slug,
    title,
    createdAt: new Date(now.getTime() - (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - i * 2 * 60 * 60 * 1000).toISOString(),
    messageCount: Math.floor(Math.random() * 8) + 2,
  }));
}

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  const validSlugs: ArchetypeSlug[] = [
    "development_director",
    "marketing_director",
    "executive_assistant",
    "programs_director",
    "finance_director",
    "hr_volunteer_coordinator",
    "events_director",
  ];

  if (!validSlugs.includes(slug as ArchetypeSlug)) {
    return NextResponse.json({ error: "Unknown team member" }, { status: 404 });
  }

  // Return stored + default conversations
  const stored = conversationStore[slug] ?? [];
  const defaults = getDefaultConversations(slug as ArchetypeSlug);

  // Stored conversations come first (most recent)
  return NextResponse.json([...stored, ...defaults]);
}

export async function POST(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  const newConversation: ConversationRecord = {
    id: crypto.randomUUID(),
    slug,
    title: "New conversation",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messageCount: 0,
  };

  if (!conversationStore[slug]) {
    conversationStore[slug] = [];
  }
  conversationStore[slug].unshift(newConversation);

  return NextResponse.json(newConversation, { status: 201 });
}
