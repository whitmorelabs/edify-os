import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";
import { getAnthropicClientForOrg } from "@/lib/anthropic";
import { generateStory, type StoryFormat } from "@/lib/story/generator";

const VALID_FORMATS: StoryFormat[] = [
  "grant_narrative",
  "social_post",
  "board_table",
  "donor_email",
  "annual_report",
];

export async function POST(req: NextRequest) {
  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  let body: { program?: string; period?: string; format?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { program, period, format } = body;

  if (!program || !period || !format) {
    return NextResponse.json(
      { error: "program, period, and format are required" },
      { status: 400 },
    );
  }

  if (!VALID_FORMATS.includes(format as StoryFormat)) {
    return NextResponse.json(
      { error: `Invalid format. Must be one of: ${VALID_FORMATS.join(", ")}` },
      { status: 400 },
    );
  }

  // Get the org's Anthropic client (BYOK)
  const clientResult = await getAnthropicClientForOrg(serviceClient, orgId);
  if ("error" in clientResult) return clientResult.error;
  const { client: anthropicClient, orgName } = clientResult;

  try {
    const result = await generateStory({
      request: {
        program,
        period,
        format: format as StoryFormat,
        orgName,
      },
      orgId,
      serviceClient,
      anthropicClient,
    });

    // Save to story_outputs
    const { error: saveError } = await serviceClient.from("story_outputs").insert({
      org_id: orgId,
      program: result.program,
      period: result.period,
      format: result.format,
      content: result.content,
    });

    if (saveError) {
      console.error("[story/generate] Failed to save story output:", saveError);
      // Don't fail the request -- the content was generated successfully
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[story/generate] Generation error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
