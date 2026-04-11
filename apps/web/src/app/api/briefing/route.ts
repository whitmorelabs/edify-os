import { NextRequest, NextResponse } from 'next/server';


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
  try {
    const body: BriefingPayload = await req.json();

    const { orgProfile, programs, goals } = body;

    // Shape the data as it would map to the orgs table
    const orgData = {
      name: orgProfile.orgName,
      mission: orgProfile.missionStatement,
      website: orgProfile.website || null,
      // Extended fields stored as metadata (not in base schema yet)
      metadata: {
        annualBudget: orgProfile.annualBudget,
        fullTimeStaff: orgProfile.fullTimeStaff ? parseInt(orgProfile.fullTimeStaff) : null,
        regularVolunteers: orgProfile.regularVolunteers ? parseInt(orgProfile.regularVolunteers) : null,
        orgType: orgProfile.orgType,
        primaryServiceArea: orgProfile.primaryServiceArea,
        foundedYear: orgProfile.foundedYear ? parseInt(orgProfile.foundedYear) : null,
      },
    };

    // Shape memory entries for programs
    const programMemories = programs.programs
      .filter((p) => p.name.trim())
      .map((p) => ({
        category: 'programs',
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
      }));

    // Shape memory entry for goals
    const goalsMemory = goals.selectedGoals.length > 0 || goals.additionalContext
      ? {
          category: 'general',
          title: 'Organizational Priorities',
          content: [
            goals.selectedGoals.length > 0
              ? `Top priorities:\n${goals.selectedGoals.map((g) => `- ${g.replace(/_/g, ' ')}`).join('\n')}`
              : null,
            goals.additionalContext ? `Additional context:\n${goals.additionalContext}` : null,
          ]
            .filter(Boolean)
            .join('\n\n'),
          source: 'briefing',
          auto_generated: false,
        }
      : null;

    // In production: save orgData to orgs table, save programMemories + goalsMemory to memory_entries
    // For now, return success with the shaped data so the frontend can proceed
    return NextResponse.json({
      success: true,
      message: 'Briefing saved successfully',
      data: {
        org: orgData,
        memories: [...programMemories, ...(goalsMemory ? [goalsMemory] : [])],
      },
    });
  } catch (error) {
    console.error('[POST /api/briefing]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save briefing' },
      { status: 500 }
    );
  }
}
