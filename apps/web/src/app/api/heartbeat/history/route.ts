import { NextResponse } from "next/server";
import type { HeartbeatResult } from "@/app/dashboard/inbox/heartbeats";

const mockHistory: HeartbeatResult[] = [
  {
    id: "hb-001",
    archetype: "development_director",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: "completed",
    title: "Grant Deadline Alert: Ford Foundation LOI Due in 5 Days",
    body: "The Ford Foundation Youth Development LOI is due April 15th. Your draft is 80% complete — the budget narrative and outcome metrics sections still need attention. Two similar grants from peer organizations closed oversubscribed last cycle, so early submission is recommended.",
    suggestedAction: "Review the draft LOI and complete the budget narrative",
    suggestedActionUrl: "/dashboard/tasks",
  },
  {
    id: "hb-002",
    archetype: "marketing_director",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    status: "completed",
    title: "Spring Campaign Engagement Up 34% This Week",
    body: "Your Spring fundraising email campaign is performing above benchmark. Open rate hit 28% (industry average: 21%) and click-through is at 6.2%. The donor spotlight feature in Tuesday's email drove the highest engagement. Consider a follow-up story post to capitalize on momentum.",
    suggestedAction: "Schedule a follow-up donor spotlight for next week",
    suggestedActionUrl: "/dashboard/tasks",
  },
  {
    id: "hb-003",
    archetype: "executive_assistant",
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    status: "completed",
    title: "3 Meetings Need Prep Materials by Tomorrow",
    body: "You have three back-to-back meetings tomorrow starting at 9 AM. The board finance committee meeting at 2 PM still needs the Q1 financial summary and program impact slides. The vendor call at 4 PM has no agenda set. I've drafted prep notes for the morning meetings.",
    suggestedAction: "Review prep notes and add Q1 financials to board packet",
    suggestedActionUrl: "/dashboard/tasks",
  },
  {
    id: "hb-004",
    archetype: "development_director",
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    status: "completed",
    title: "Major Donor Prospect: New Signal from the Martinez Family",
    body: "The Martinez Family Foundation posted a new grant cycle announcement aligned with your youth mentorship work. They funded two comparable organizations last year at $75K–$100K. Their program officer, Diana Reyes, attended your community forum in February. A warm intro through board member Chen may be the right first step.",
    suggestedAction: "Ask board member Chen for an introduction to Diana Reyes",
  },
  {
    id: "hb-005",
    archetype: "finance_director",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    status: "completed",
    title: "Monthly Cash Flow Summary: April Looking Strong",
    body: "April revenue is tracking 12% ahead of budget with two grants closing early. Operating expenses are on target. The reserve fund is at 2.8 months of operating costs, up from 2.3 last month. One outstanding invoice from a March event ($4,200) remains unpaid at 35 days.",
    suggestedAction: "Follow up on the outstanding $4,200 invoice",
  },
  {
    id: "hb-006",
    archetype: "marketing_director",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    status: "skipped",
    title: null,
    body: null,
    suggestedAction: null,
    skipReason: "No significant updates since last check-in",
  },
  {
    id: "hb-007",
    archetype: "programs_director",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    status: "skipped",
    title: null,
    body: null,
    suggestedAction: null,
    skipReason: "Check-ins are currently disabled for this team member",
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const archetype = searchParams.get("archetype");

  let results = mockHistory;
  if (archetype) {
    results = mockHistory.filter((h) => h.archetype === archetype);
  }

  return NextResponse.json(results);
}
