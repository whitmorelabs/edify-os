import { NextResponse } from "next/server";
import { createServiceRoleClient, getAuthContext } from "@/lib/supabase/server";

/**
 * DELETE /api/conversations/[id]
 *
 * Deletes a conversation (and its messages, via CASCADE) from the database.
 * Auth check: the conversation must belong to the caller's org.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Verify the conversation belongs to the caller's org before deleting.
  const { data: existing, error: fetchError } = await serviceClient
    .from("conversations")
    .select("id")
    .eq("id", id)
    .eq("org_id", orgId)
    .maybeSingle();

  if (fetchError) {
    console.error("[conversations/delete] Fetch error:", fetchError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error: deleteError } = await serviceClient
    .from("conversations")
    .delete()
    .eq("id", id)
    .eq("org_id", orgId);

  if (deleteError) {
    console.error("[conversations/delete] Delete error:", deleteError);
    return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
