import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, getAuthContext } from '@/lib/supabase/server';

/** GET /api/integrations — list connected integrations for the org */
export async function GET() {
  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { data: integrations, error } = await serviceClient
    .from('integrations')
    .select('id, type, status, created_at, updated_at')
    .eq('org_id', orgId)
    .eq('status', 'active');

  if (error) {
    console.error('[integrations GET] DB error:', error);
    return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 });
  }

  // Shape into the format the frontend expects
  const connected = (integrations ?? []).map((i) => ({
    id: i.id,
    integrationId: i.type,
    connectedAt: i.created_at,
  }));

  return NextResponse.json({ success: true, connected });
}

/** POST /api/integrations — initiate the connection flow */
export async function POST(req: NextRequest) {
  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { integrationId } = body as { integrationId: string };

    if (!integrationId) {
      return NextResponse.json(
        { success: false, error: 'integrationId is required' },
        { status: 400 }
      );
    }

    // Build OAuth redirect URL
    // For now we return a mock URL since real OAuth per-integration is Phase 2 work.
    // The callback route handles real token exchange when code is present.
    const callbackBase = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const oauthUrl = `${callbackBase}/api/integrations/callback?integration=${integrationId}&mock=true`;

    return NextResponse.json({ success: true, integrationId, oauthUrl });
  } catch (err) {
    console.error('[POST /api/integrations]', err);
    return NextResponse.json(
      { success: false, error: 'Failed to start connection flow' },
      { status: 500 }
    );
  }
}

/** DELETE /api/integrations — disconnect an integration */
export async function DELETE(req: NextRequest) {
  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const integrationId = searchParams.get('integrationId');

    if (!integrationId) {
      return NextResponse.json(
        { success: false, error: 'integrationId is required' },
        { status: 400 }
      );
    }

    const serviceClient = createServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    // Soft-delete by updating status to revoked
    const { error } = await serviceClient
      .from('integrations')
      .update({ status: 'revoked' })
      .eq('org_id', orgId)
      .eq('type', integrationId);

    if (error) {
      console.error('[DELETE /api/integrations] DB error:', error);
      return NextResponse.json({ success: false, error: 'Failed to disconnect' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/integrations]', err);
    return NextResponse.json(
      { success: false, error: 'Failed to disconnect integration' },
      { status: 500 }
    );
  }
}
