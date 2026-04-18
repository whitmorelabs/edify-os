import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, getAuthContext } from '@/lib/supabase/server';

interface BriefingPayload {
  orgProfile: {
    orgName: string;
    missionStatement: string;
    website: string;
    annualBudget: string;
    fullTimeStaff: string;
    regularVolunteers: string;
    orgType: string;
    primaryServiceArea: string;
    foundedYear: string;
  };
  programs: {
    programs: Array<{
      id: string;
      name: string;
      description: string;
      annualBudget: string;
      peopleServed: string;
      keyOutcomes: string;
    }>;
  };
  goals: {
    selectedGoals: string[];
    additionalContext: string;
  };
}

export async function POST(req: NextRequest) {
  const { user, orgId, memberId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: BriefingPayload = await req.json();
    const { orgProfile, programs, goals } = body;

    const serviceClient = createServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    // Update org profile
    const { error: orgError } = await serviceClient
      .from('orgs')
      .update({
        name: orgProfile.orgName,
        mission: orgProfile.missionStatement,
        website: orgProfile.website || null,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('id', orgId);

    if (orgError) {
      console.error('[briefing] Org update error:', orgError);
      return NextResponse.json({ success: false, error: 'Failed to save org profile' }, { status: 500 });
    }

    // Create memory entries for programs
    const programMemories = programs.programs
      .filter((p) => p.name.trim())
      .map((p) => ({
        org_id: orgId,
        category: 'programs' as const,
        title: p.name,
        content: [
          p.description,
          p.annualBudget ? `Annual budget: $${parseInt(p.annualBudget).toLocaleString()}` : null,
          p.peopleServed ? `People served per year: ${parseInt(p.peopleServed).toLocaleString()}` : null,
          p.keyOutcomes ? `Key outcomes: ${p.keyOutcomes}` : null,
        ]
          .filter(Boolean)
          .join('\n'),
        source: 'briefing',
        auto_generated: false,
        created_by: memberId,
      }));

    // Create memory entry for goals
    const goalsContent = [
      goals.selectedGoals.length > 0
        ? `Top priorities:\n${goals.selectedGoals.map((g) => `- ${g.replace(/_/g, ' ')}`).join('\n')}`
        : null,
      goals.additionalContext ? `Additional context:\n${goals.additionalContext}` : null,
    ]
      .filter(Boolean)
      .join('\n\n');

    const memoryInserts: Array<{
      org_id: string;
      category: string;
      title: string;
      content: string;
      source: string;
      auto_generated: boolean;
      created_by: string | null;
    }> = [...programMemories];

    if (goalsContent) {
      memoryInserts.push({
        org_id: orgId,
        category: 'general' as const,
        title: 'Organizational Priorities',
        content: goalsContent,
        source: 'briefing',
        auto_generated: false,
        created_by: memberId,
      });
    }

    if (memoryInserts.length > 0) {
      const { error: memoryError } = await serviceClient
        .from('memory_entries')
        .insert(memoryInserts);

      if (memoryError) {
        console.error('[briefing] Memory insert error:', memoryError);
        // Don't fail the whole request — org profile was saved
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Briefing saved successfully',
    });
  } catch (error) {
    console.error('[POST /api/briefing]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save briefing' },
      { status: 500 }
    );
  }
}
