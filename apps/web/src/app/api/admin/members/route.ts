import { NextRequest, NextResponse } from "next/server";

const mockMembers = [
  {
    id: "1",
    name: "Sarah Chen",
    email: "sarah@hopefoundation.org",
    role: "owner",
    joinedAt: "2024-01-15",
    lastActive: "2025-04-10",
    avatarInitials: "SC",
  },
  {
    id: "2",
    name: "Marcus Johnson",
    email: "marcus@hopefoundation.org",
    role: "admin",
    joinedAt: "2024-02-03",
    lastActive: "2025-04-09",
    avatarInitials: "MJ",
  },
  {
    id: "3",
    name: "Priya Patel",
    email: "priya@hopefoundation.org",
    role: "member",
    joinedAt: "2024-03-20",
    lastActive: "2025-04-08",
    avatarInitials: "PP",
  },
  {
    id: "4",
    name: "Daniel Torres",
    email: "daniel@hopefoundation.org",
    role: "member",
    joinedAt: "2024-06-11",
    lastActive: "2025-04-07",
    avatarInitials: "DT",
  },
];

export async function GET() {
  return NextResponse.json({ members: mockMembers });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, role } = body;

  if (!email || !role) {
    return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
  }

  // Mock success — in production this would create an invitation record
  return NextResponse.json({
    success: true,
    message: `Invitation sent to ${email} as ${role}.`,
  });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { memberId, role } = body;

  if (!memberId || !role) {
    return NextResponse.json({ error: "Member ID and role are required" }, { status: 400 });
  }

  return NextResponse.json({ success: true, memberId, role });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");

  if (!memberId) {
    return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
  }

  return NextResponse.json({ success: true, memberId });
}
