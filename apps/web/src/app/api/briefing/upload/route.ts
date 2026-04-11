import { NextRequest, NextResponse } from 'next/server';

// Maps document category -> memory_entries category (one or more)
// Valid memory_entries categories: mission, programs, donors, grants,
// campaigns, brand_voice, contacts, processes, general
const CATEGORY_MAP: Record<string, string[]> = {
  strategic_plan: ['mission'],
  grant_proposal: ['grants'],
  donor_list: ['donors'],
  financial_statement: ['general'],   // no 'financials' in schema yet; falls back to general
  program_description: ['programs'],
  marketing_materials: ['brand_voice', 'campaigns'],
  event_plan: ['general'],            // no 'events' in schema yet; falls back to general
  staff_roster: ['contacts'],         // no 'volunteers' in schema; contacts is closest
  board_documents: ['general'],
  other: ['general'],
};

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
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

    // Validate by extension as fallback (some clients send empty MIME types)
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

    // Mock document ID — in production this would:
    // 1. Store file in Supabase Storage
    // 2. Extract text from PDF/DOC/etc.
    // 3. Create memory_entries record(s) with the extracted text
    // 4. Generate embedding for semantic search
    const mockDocId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    return NextResponse.json({
      success: true,
      docId: mockDocId,
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
