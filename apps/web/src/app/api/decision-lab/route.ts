import { NextRequest, NextResponse } from 'next/server';

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------
export interface ArchetypeResponse {
  role_slug: string;
  display_name: string;
  icon: string;
  stance: 'Support' | 'Caution' | 'Oppose';
  response_text: string;
  confidence: 'Low' | 'Medium' | 'High';
}

export interface SynthesisResult {
  consensus: string[];
  disagreements: string[];
  top_risks: string[];
  recommended_action: string;
}

export interface ScenarioResult {
  id: string;
  scenario_text: string;
  created_at: string;
  responses: ArchetypeResponse[];
  synthesis: SynthesisResult;
}

// -------------------------------------------------------------------
// Mock data generator
// -------------------------------------------------------------------
function buildMockResult(scenarioText: string): ScenarioResult {
  return {
    id: `mock-${Date.now()}`,
    scenario_text: scenarioText,
    created_at: new Date().toISOString(),
    responses: [
      {
        role_slug: 'executive_assistant',
        display_name: 'Executive Assistant',
        icon: 'Star',
        stance: 'Caution',
        response_text:
          "Before moving forward, we need to align this with our strategic plan and ensure the board is informed. The timing matters — our team is already stretched, and we should pressure-test our capacity before committing. That said, if the opportunity is genuinely time-sensitive, a phased approach could reduce risk.",
        confidence: 'Medium',
      },
      {
        role_slug: 'finance_director',
        display_name: 'Finance Director',
        icon: 'DollarSign',
        stance: 'Caution',
        response_text:
          "Financially, we need 3-6 months of runway before taking on any new obligation. Current reserves are below our policy threshold. I'd want a detailed pro forma, including worst-case and best-case cash flow projections, before recommending approval. The opportunity cost of diverting staff time is also real and should be quantified.",
        confidence: 'High',
      },
      {
        role_slug: 'development_director',
        display_name: 'Development Director',
        icon: 'Landmark',
        stance: 'Support',
        response_text:
          "This looks like a strong signal to funders that we're growing and taking initiative. It could open doors for multi-year grants and major donor conversations. I'd recommend we document the decision-making process to show due diligence — that story plays well in grant narratives.",
        confidence: 'High',
      },
      {
        role_slug: 'marketing_director',
        display_name: 'Marketing Director',
        icon: 'Megaphone',
        stance: 'Support',
        response_text:
          "The optics are good. This gives us a news peg — we can build a campaign around the announcement and use it to re-engage lapsed donors. Social media storytelling potential is high. My only flag is we need at least 3 weeks of lead time to do it properly.",
        confidence: 'Medium',
      },
      {
        role_slug: 'programs_director',
        display_name: 'Programs Director',
        icon: 'Heart',
        stance: 'Oppose',
        response_text:
          "My concern is mission drift. Every hour spent on this is an hour not spent on direct service delivery. Our current program participants deserve our full attention, and I worry we're being opportunistic rather than strategic. If we do this, we need protected staff time and clear guardrails.",
        confidence: 'High',
      },
      {
        role_slug: 'hr_volunteer_coordinator',
        display_name: 'HR & Volunteer Coordinator',
        icon: 'Users',
        stance: 'Caution',
        response_text:
          "Team morale is already fragile after last quarter. Adding new responsibilities without adding headcount is a burnout risk. If we move forward, I'd want a clear staffing plan, updated job descriptions, and an honest conversation with the team before announcing anything publicly.",
        confidence: 'Medium',
      },
      {
        role_slug: 'events_director',
        display_name: 'Events Director',
        icon: 'Calendar',
        stance: 'Support',
        response_text:
          "From an events standpoint, this gives us a natural milestone to build programming around. A launch event could double as a fundraiser and community engagement moment. I'd want to start scoping logistics now if we're serious — good venues book fast.",
        confidence: 'Medium',
      },
    ],
    synthesis: {
      consensus: [
        'The decision requires a clear staffing plan before moving forward',
        'Funder and donor communication should be proactive, not reactive',
        'Timeline planning needs to begin immediately if approved',
      ],
      disagreements: [
        'Programs team sees mission risk; Development team sees strategic opportunity',
        'Finance wants more runway; Marketing sees a time-sensitive window',
      ],
      top_risks: [
        'Staff burnout if new responsibilities are added without capacity relief',
        'Cash flow strain if costs exceed projections in months 1-3',
        'Mission dilution if program delivery suffers during the transition',
      ],
      recommended_action:
        "Move to a conditional green light: approve in principle, contingent on a staffing plan from HR within two weeks and a cash flow pro forma from Finance. Set a board briefing before any public announcement. If both deliverables check out, proceed with a phased rollout starting in Q3.",
    },
  };
}

// -------------------------------------------------------------------
// Route handlers
// -------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const { scenario_text, selected_archetypes } = await req.json() as {
      scenario_text: string;
      selected_archetypes?: string[];
    };

    if (!scenario_text || typeof scenario_text !== 'string' || scenario_text.trim().length === 0) {
      return NextResponse.json({ error: 'scenario_text is required' }, { status: 400 });
    }

    // Attempt to proxy to backend agent service
    const backendUrl = process.env.AGENT_SERVICE_URL ?? 'http://localhost:4000';
    try {
      const upstream = await fetch(`${backendUrl}/api/decision-lab`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_text, selected_archetypes }),
        signal: AbortSignal.timeout(5000),
      });
      if (upstream.ok) {
        const data = await upstream.json();
        return NextResponse.json(data);
      }
    } catch {
      // Backend not available — fall through to mock
    }

    // Return mock data so the frontend is independently testable
    const result = buildMockResult(scenario_text.trim());

    // Filter by selected archetypes if provided
    if (selected_archetypes && selected_archetypes.length > 0) {
      result.responses = result.responses.filter((r) =>
        selected_archetypes.includes(r.role_slug),
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('[decision-lab] POST error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  // Return mock history list
  const history = [
    {
      id: 'mock-history-1',
      scenario_text: 'Should we cancel our annual gala?',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'mock-history-2',
      scenario_text: 'We\'re considering expanding to a second location',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
  return NextResponse.json(history);
}
