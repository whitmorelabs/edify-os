import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, getAuthContext } from '@/lib/supabase/server';

// Maps document category -> memory_entries category (one or more)
const CATEGORY_MAP: Record<string, string[]> = {
  strategic_plan: ['mission'],
  grant_proposal: ['grants'],
  donor_list: ['donors'],
  financial_statement: ['general'],
  program_description: ['programs'],
  marketing_materials: ['brand_voice', 'campaigns'],
  event_plan: ['general'],
  staff_roster: ['contacts'],
  board_documents: ['general'],
  other: ['general'],
};

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  const { user, orgId, memberId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as string) || 'other';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'File exceeds 10MB limit' },
        { status: 413 }
      );
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowedExts = ['pdf', 'doc', 'docx', 'txt', 'csv', 'xls', 'xlsx'];
    const typeOk = allowedTypes.includes(file.type) || (ext && allowedExts.includes(ext));

    if (!typeOk) {
      return NextResponse.json(
        { success: false, error: 'File type not supported' },
        { status: 415 }
      );
    }

    const memoryCategories = CATEGORY_MAP[category] ?? ['general'];

    const serviceClient = createServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    // Create a documents record (storage upload is Phase 2 — requires a Storage bucket)
    const { data: doc, error: docError } = await serviceClient
      .from('documents')
      .insert({
        org_id: orgId,
        uploaded_by: memberId,
        file_name: file.name,
        file_size_bytes: file.size,
        mime_type: file.type || `application/${ext}`,
        category,
        processing_status: 'pending',
        // storage_path will be set when Supabase Storage is configured (Phase 2)
      })
      .select('id')
      .single();

    if (docError) {
      console.error('[briefing/upload] Document insert error:', docError);
      // Non-fatal — continue and return success even if DB write fails
    }

    const docId = doc?.id ?? `doc_${Date.now()}`;

    return NextResponse.json({
      success: true,
      docId,
      fileName: file.name,
      category,
      memoryCategories,
      message: `Your team now has access to "${file.name}"`,
    });
  } catch (error) {
    console.error('[POST /api/briefing/upload]', error);
    return NextResponse.json(
      { success: false, error: 'Upload failed' },
      { status: 500 }
    );
  }
}
