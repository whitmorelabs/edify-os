import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, getAuthContext } from '@/lib/supabase/server';

export async function GET() {
  const { user, orgId, memberId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { data: notifications, error } = await serviceClient
    .from('notifications')
    .select('id, type, title, body, archetype, link, read, created_at')
    .eq('org_id', orgId)
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[notifications GET] DB error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }

  // Shape into the format the frontend expects
  const shaped = (notifications ?? []).map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    archetype: n.archetype,
    link: n.link,
    read: n.read,
    timestamp: n.created_at,
  }));

  return NextResponse.json(shaped);
}

export async function PATCH(req: NextRequest) {
  const { user, orgId, memberId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as { ids: string[] };
  const { ids } = body;

  if (!Array.isArray(ids)) {
    return NextResponse.json({ error: 'ids must be an array' }, { status: 400 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { error } = await serviceClient
    .from('notifications')
    .update({ read: true })
    .in('id', ids)
    .eq('member_id', memberId);

  if (error) {
    console.error('[notifications PATCH] DB error:', error);
    return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 });
  }

  return NextResponse.json({ updated: ids, success: true });
}
