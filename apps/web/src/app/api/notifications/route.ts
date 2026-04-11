import { NextRequest, NextResponse } from 'next/server';
import type { Notification } from '@/components/notifications/types';

// Mock notifications — realistic sample data
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-001',
    type: 'checkin',
    title: 'Your Director of Development has an update',
    body: 'Ford Foundation LOI deadline is in 3 days. Two new donor prospects surfaced from last week\'s event — both show strong giving history.',
    archetype: 'development_director',
    link: '/dashboard/inbox?section=team-updates',
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(), // 12 min ago
    read: false,
  },
  {
    id: 'notif-002',
    type: 'checkin',
    title: 'Your Marketing Director checked in',
    body: 'Last week\'s impact post is outperforming average by 2.4x. Recommends boosting the Friday post before the gala.',
    archetype: 'marketing_director',
    link: '/dashboard/inbox?section=team-updates',
    timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(), // 1.5 hrs ago
    read: false,
  },
  {
    id: 'notif-003',
    type: 'message',
    title: 'Your Executive Assistant has a heads-up',
    body: 'Board meeting moved to Thursday at 2 PM. I\'ve updated your calendar and sent the agenda to attendees.',
    archetype: 'executive_assistant',
    link: '/dashboard/inbox',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hrs ago
    read: false,
  },
  {
    id: 'notif-004',
    type: 'checkin',
    title: 'Your Programs Director checked in',
    body: 'Q1 outcomes report is due in 10 days. Youth Workforce program is on track; Housing Stability program needs 2 additional outcome entries.',
    archetype: 'programs_director',
    link: '/dashboard/inbox?section=team-updates',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hrs ago
    read: true,
  },
  {
    id: 'notif-005',
    type: 'system',
    title: 'Google Calendar connected',
    body: 'Your Executive Assistant can now see your availability and schedule meetings on your behalf.',
    link: '/dashboard/integrations',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // yesterday
    read: true,
  },
  {
    id: 'notif-006',
    type: 'message',
    title: 'Your Finance Director flagged something',
    body: 'March expenses are running 8% over budget on program delivery. Sending a full breakdown to your inbox.',
    archetype: 'finance_director',
    link: '/dashboard/inbox',
    timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(), // yesterday
    read: true,
  },
];

export async function GET() {
  return NextResponse.json(MOCK_NOTIFICATIONS);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json() as { ids: string[] };
  const { ids } = body;

  if (!Array.isArray(ids)) {
    return NextResponse.json({ error: 'ids must be an array' }, { status: 400 });
  }

  // In a real implementation this would write to a database.
  // For now just echo back success.
  return NextResponse.json({ updated: ids, success: true });
}
