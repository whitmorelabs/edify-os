import { NextRequest, NextResponse } from 'next/server';


/**
 * GET /api/integrations/callback
 *
 * Handles the OAuth redirect after the user grants access in the provider's UI.
 *
 * Real flow (production):
 * 1. Read the `code` query param sent back by the OAuth provider.
 * 2. Verify the `state` param matches the one generated at authorization start
 *    to prevent CSRF.
 * 3. Exchange the code for access + refresh tokens via the provider's token endpoint.
 * 4. Encrypt the tokens and store them in the `integrations` table for the org.
 * 5. Close the popup and fire a postMessage back to the parent window.
 *
 * Mock flow (development / demo):
 * - When `mock=true` is present we skip token exchange and post a success message
 *   directly so the frontend flow completes.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const integrationId = searchParams.get('integration') ?? '';
  const code = searchParams.get('code');
  const isMock = searchParams.get('mock') === 'true';
  const error = searchParams.get('error');

  // --- Error case: user denied access ---
  if (error) {
    return new NextResponse(closePopupHtml(integrationId, false, error), {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  if (isMock) {
    // Demo: skip real token exchange, report success immediately
    return new NextResponse(closePopupHtml(integrationId, true), {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // Production: exchange code for tokens
  if (!code) {
    return new NextResponse(
      closePopupHtml(integrationId, false, 'No authorization code was returned.'),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  // TODO: Returns 501 until per-integration token exchange is implemented (Phase 2 — Google Workspace OAuth first).
  // When implemented: exchange code for tokens, encrypt, store in integrations table.
  return NextResponse.json(
    { error: "OAuth token exchange not yet implemented for this integration type" },
    { status: 501 }
  );
}

/**
 * Returns a minimal HTML page that fires a postMessage to the opener (the
 * OAuthModal component) and then closes itself.
 */
function closePopupHtml(integrationId: string, success: boolean, message?: string): string {
  const payload = success
    ? JSON.stringify({ type: 'oauth_success', integrationId })
    : JSON.stringify({ type: 'oauth_error', integrationId, message: message ?? 'Connection failed.' });

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>Linking account...</title></head>
<body>
  <p style="font-family:sans-serif;text-align:center;margin-top:3rem;color:#64748b;">
    ${success ? 'Account linked! Closing window...' : 'Something went wrong. Closing window...'}
  </p>
  <script>
    try {
      if (window.opener) {
        window.opener.postMessage(${payload}, '*');
      }
    } catch (e) {}
    setTimeout(function() { window.close(); }, 800);
  </script>
</body>
</html>`;
}
