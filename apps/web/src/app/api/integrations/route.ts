import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-static';

// In production these would come from Supabase using the authenticated user's org_id.
// For now we return mock data so the frontend flow works end-to-end.

const MOCK_CONNECTED: Array<{
  id: string;
  integrationId: string;
  connectedAccount: string;
  connectedAt: string;
}> = [];

// Map of integration ID -> mock OAuth start URL.
// In production these would be real OAuth authorization URLs built server-side
// using the appropriate client_id and redirect_uri for each service.
function buildMockOAuthUrl(integrationId: string): string {
  const callbackBase =
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  // The callback route will handle the code exchange and post a message back
  return `${callbackBase}/api/integrations/callback?integration=${integrationId}&mock=true`;
}

/** GET /api/integrations — list connected integrations for the org */
export async function GET() {
  return NextResponse.json({
    success: true,
    connected: MOCK_CONNECTED,
  });
}

/** POST /api/integrations — initiate the connection flow */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { integrationId } = body as { integrationId: string };

    if (!integrationId) {
      return NextResponse.json(
        { success: false, error: 'integrationId is required' },
        { status: 400 }
      );
    }

    // In production: validate the user is authenticated, look up the service's
    // OAuth config, build the real authorization URL with state param, etc.
    const oauthUrl = buildMockOAuthUrl(integrationId);

    return NextResponse.json({
      success: true,
      integrationId,
      oauthUrl,
    });
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
  try {
    const { searchParams } = new URL(req.url);
    const integrationId = searchParams.get('integrationId');

    if (!integrationId) {
      return NextResponse.json(
        { success: false, error: 'integrationId is required' },
        { status: 400 }
      );
    }

    // In production: revoke the stored token and delete from DB
    const idx = MOCK_CONNECTED.findIndex((c) => c.integrationId === integrationId);
    if (idx !== -1) MOCK_CONNECTED.splice(idx, 1);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/integrations]', err);
    return NextResponse.json(
      { success: false, error: 'Failed to disconnect integration' },
      { status: 500 }
    );
  }
}
