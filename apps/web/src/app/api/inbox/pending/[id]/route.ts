import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";

type ApprovalStatus = "approved" | "rejected";

interface PatchBody {
  status?: ApprovalStatus;
  output_preview?: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { status, output_preview } = body as PatchBody;

  if (status !== undefined && status !== "approved" && status !== "rejected") {
    return NextResponse.json(
      { error: "status must be 'approved' or 'rejected'" },
      { status: 400 }
    );
  }

  if (status === undefined && output_preview === undefined) {
    return NextResponse.json(
      { error: "Provide status and/or output_preview" },
      { status: 400 }
    );
  }

  // Verify the approval belongs to the caller's org before mutating
  const { data: existing, error: fetchError } = await serviceClient
    .from("approvals")
    .select("id, org_id, status")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Approval not found" }, { status: 404 });
  }

  if ((existing.org_id as string) !== orgId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updatePayload: Record<string, unknown> = {};

  if (status !== undefined) {
    updatePayload.status = status;
    // approvals table has decided_at (no separate approved_at/rejected_at)
    updatePayload.decided_at = new Date().toISOString();
  }

  if (output_preview !== undefined) {
    updatePayload.output_preview = output_preview;
  }

  const { data: updated, error: updateError } = await serviceClient
    .from("approvals")
    .update(updatePayload)
    .eq("id", id)
    .select(
      "id, title, summary, output_preview, confidence_score, urgency, status, created_at"
    )
    .single();

  if (updateError || !updated) {
    return NextResponse.json(
      { error: updateError?.message ?? "Update failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    id: updated.id as string,
    title: updated.title as string,
    summary: updated.summary as string,
    preview: (updated.output_preview as string | null) ?? "",
    confidence: (updated.confidence_score as number | null) ?? 0.75,
    urgency: updated.urgency as string,
    status: updated.status as "pending" | "approved" | "rejected",
    createdAt: updated.created_at as string,
    source: "approvals" as const,
  });
}
