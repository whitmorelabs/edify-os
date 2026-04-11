import { NextRequest, NextResponse } from "next/server";

function getMockUsage(days: number) {
  const multiplier = days / 7;

  return {
    period: `Last ${days} days`,
    summary: {
      totalConversations: Math.round(142 * multiplier),
      totalMessages: Math.round(1087 * multiplier),
      tasksCreated: Math.round(63 * multiplier),
      heartbeatsDelivered: Math.round(84 * multiplier),
      documentsUploaded: Math.round(17 * multiplier),
    },
    byArchetype: [
      {
        slug: "development_director",
        label: "Director of Development",
        conversations: Math.round(38 * multiplier),
        messages: Math.round(294 * multiplier),
        tasks: Math.round(18 * multiplier),
        color: "bg-emerald-500",
      },
      {
        slug: "executive_assistant",
        label: "Executive Assistant",
        conversations: Math.round(32 * multiplier),
        messages: Math.round(241 * multiplier),
        tasks: Math.round(14 * multiplier),
        color: "bg-sky-500",
      },
      {
        slug: "marketing_director",
        label: "Marketing Director",
        conversations: Math.round(27 * multiplier),
        messages: Math.round(198 * multiplier),
        tasks: Math.round(11 * multiplier),
        color: "bg-amber-500",
      },
      {
        slug: "programs_director",
        label: "Programs Director",
        conversations: Math.round(22 * multiplier),
        messages: Math.round(162 * multiplier),
        tasks: Math.round(9 * multiplier),
        color: "bg-violet-500",
      },
      {
        slug: "finance_director",
        label: "Finance Director",
        conversations: Math.round(14 * multiplier),
        messages: Math.round(114 * multiplier),
        tasks: Math.round(7 * multiplier),
        color: "bg-teal-500",
      },
      {
        slug: "hr_volunteer_coordinator",
        label: "HR & Volunteer Coordinator",
        conversations: Math.round(7 * multiplier),
        messages: Math.round(56 * multiplier),
        tasks: Math.round(3 * multiplier),
        color: "bg-indigo-500",
      },
      {
        slug: "events_director",
        label: "Events Director",
        conversations: Math.round(2 * multiplier),
        messages: Math.round(22 * multiplier),
        tasks: Math.round(1 * multiplier),
        color: "bg-rose-500",
      },
    ],
    hourlyDistribution: [
      { hour: 6, label: "6 AM", value: 8 },
      { hour: 7, label: "7 AM", value: 14 },
      { hour: 8, label: "8 AM", value: 31 },
      { hour: 9, label: "9 AM", value: 67 },
      { hour: 10, label: "10 AM", value: 88 },
      { hour: 11, label: "11 AM", value: 74 },
      { hour: 12, label: "12 PM", value: 52 },
      { hour: 13, label: "1 PM", value: 61 },
      { hour: 14, label: "2 PM", value: 79 },
      { hour: 15, label: "3 PM", value: 83 },
      { hour: 16, label: "4 PM", value: 71 },
      { hour: 17, label: "5 PM", value: 48 },
      { hour: 18, label: "6 PM", value: 22 },
      { hour: 19, label: "7 PM", value: 11 },
    ],
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "7", 10);
  const validDays = [7, 30, 90].includes(days) ? days : 7;

  return NextResponse.json(getMockUsage(validDays));
}
