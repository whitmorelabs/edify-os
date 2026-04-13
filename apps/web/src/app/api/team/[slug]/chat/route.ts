import { NextResponse } from "next/server";
import type { ArchetypeSlug } from "@/app/dashboard/inbox/heartbeats";

export function generateStaticParams() {
  const validSlugs: ArchetypeSlug[] = [
    "development_director",
    "marketing_director",
    "executive_assistant",
    "programs_director",
    "hr_volunteer_coordinator",
    "events_director",
  ];
  return validSlugs.map((slug) => ({ slug }));
}

// Mock responses per archetype -- each has a distinct voice and domain
const MOCK_RESPONSES: Record<string, string[]> = {
  development_director: [
    "Great question. I've been watching the **Ford Foundation's** Youth and Government program — their LOI deadline is May 30th, and based on your last grant submission's language, you're well-positioned. Want me to draft talking points for the executive summary?",
    "Your donor retention rate is sitting at 68% — that's solid, but there's room to grow. The donors who gave $500+ last year and haven't heard from you in 90+ days are the low-hanging fruit. I can pull that segment and draft a personalized outreach sequence.",
    "On the spring campaign: I'd recommend leading with impact numbers rather than need. Donors respond to *momentum*, not desperation. Your after-school program served 340 kids last quarter — that's the headline.",
    "The **Community Foundation** RFP just dropped — $75K available for workforce development initiatives. Your programs fit 4 of the 5 priority areas. Deadline is 6 weeks out, which is tight but doable. Should I start the narrative outline?",
    "Your major gifts pipeline has three donors in the $10K+ conversation stage. I'd suggest a personal call from the ED before end of month — that kind of touch closes at 2x the rate of email follow-up alone.",
  ],
  marketing_director: [
    "Your Instagram reach dropped 18% this month — but that's a platform algorithm shift, not a content quality issue. Your engagement *rate* actually went up, which means your audience is more qualified. I'd hold the strategy and give it two more weeks before reacting.",
    "The **Annual Impact Report** blog post is ready to schedule. I'd recommend Tuesday at 10 AM — your audience engagement data shows Tuesday mid-morning outperforms Friday by 34%. Want me to queue it up?",
    "For the gala, you need a press release hitting local media 3 weeks out, not 1. I'll draft the release, a pitch email for community reporters, and a social countdown series. That's a 5-day sprint — want to kick it off this week?",
    "Your email open rate is 31% — well above the nonprofit average of 24%. The subject lines that perform best for your audience are **question-format** headlines. I'll test three variations on the next send.",
    "LinkedIn is underutilized for your audience. Board members sharing program stories outperforms brand posts by 4x for nonprofit brands. I can draft a template series your board can post individually — takes the friction out of it.",
  ],
  executive_assistant: [
    "You have three scheduling conflicts in the next 10 days. The most urgent: the Board Finance Committee meets the same day as the site visit with your major funder. I'd recommend moving the committee to the following Thursday — I checked board member calendars and Thursday works for 6 of 7 members.",
    "Your inbox has 14 messages that have been sitting for 5+ days. I've categorized them: 3 need a decision from you, 4 need a drafted reply, and 7 are informational that can be archived. Want to tackle the decision ones first?",
    "The May gala planning meeting is missing three agenda items the venue coordinator flagged. I'll add them and resend the updated agenda to all attendees. Do you want the pre-read materials attached, or just the agenda?",
    "You're at 23 action items this week. I'd suggest a quick priority sort — I've flagged 5 that are past due and 3 that have external dependencies holding things up. We can clear the blockers in a 20-minute call.",
    "The grant report for the **Kresge Foundation** is due in 19 days. Last time, you submitted 3 days before deadline. I've blocked 4 hours on your calendar for writing and can pull the program data you'll need from the intake records.",
  ],
  programs_director: [
    "Your **Q1 outcome data** is ready for review. The after-school program hit 94% of its attendance targets, but the reading improvement metric is tracking 8 points below projection. That's worth a conversation with the program coordinator before the funder report is due.",
    "Three compliance items are coming up in the next 30 days: the Title IV documentation audit, the volunteer background check renewals for 12 volunteers, and the state registration renewal. I can draft the checklist and assign owners for each.",
    "The waitlist for the summer youth program is at 47 families — that's 2x last year. If you can secure one additional part-time facilitator, you could expand by 15 slots. Want me to pull the budget impact numbers?",
    "The **community partner survey** results are in. Partners rate coordination at 4.1/5, but communication timeliness dropped to 3.2. That's the thing to address before the next partner meeting — I can draft a communication protocol proposal.",
    "Your program model documentation is 18 months out of date. Funders increasingly request replication-ready materials. A two-day documentation sprint would get you current — I can structure the outline and facilitation guide.",
  ],
  hr_volunteer_coordinator: [
    "You have **3 open volunteer coordinator applications** this week — all look strong on paper. I've drafted interview questions tailored to each applicant's background. The best available interview slot that works across your team is Thursday at 2 PM.",
    "Volunteer certifications: 8 volunteers have their food handling certification expiring in the next 60 days. I've drafted renewal reminder emails for all 8. Should I send them now or schedule for 45 days out?",
    "The staff pulse survey results are in. Team morale is trending positive (4.2/5), but workload balance scored 2.9. That's a yellow flag. The clearest signal: two program staff feel they lack clarity on priorities. A short team alignment session could address it.",
    "The new volunteer orientation materials haven't been updated since 2023. With the program expansion, three sections are now inaccurate. I can revise the handbook and create a 15-minute onboarding video script — want to start with the handbook?",
    "Your **retention data** shows volunteers who receive a personal thank-you within 48 hours of their first shift return at 3x the rate. You have 6 first-time volunteers from last week. I'll draft personalized notes — want to review before I send?",
  ],
  events_director: [
    "The **May 15th gala** checklist: venue is confirmed, catering is under contract, AV is booked. Still open: sponsorship acknowledgment signage, the program booklet layout, and the silent auction item collection. The signage needs the longest lead time — I'd start that today.",
    "Your sponsorship pipeline has 4 prospects who haven't responded to the second outreach. A personal call from the ED typically moves these. I can prep a 60-second call script and talking points for each prospect.",
    "The **volunteer roles** for the gala need to be filled: 12 people for guest check-in, 4 for the auction table, and 6 for logistics. I've drafted a volunteer recruitment email for your newsletter list and can post to VolunteerMatch simultaneously.",
    "Post-event follow-up for the March fundraiser: 23 attendees haven't received a personal thank-you yet, and 8 made first-time donations over $250. Those 8 should get a handwritten note or call within the week — I can draft both options.",
    "The event budget has a $2,200 buffer remaining. I'd recommend reserving $1,500 as a contingency and using the $700 on upgraded centerpieces — it photographs better for social media, which affects next year's ticket sales.",
  ],
};

function getMockResponse(slug: string, message: string): string {
  const responses = MOCK_RESPONSES[slug] ?? [
    "I'm reviewing your question and will have a thoughtful response shortly. In the meantime, feel free to share any additional context that might help.",
  ];

  // Rotate through responses based on message hash for variety
  const hash = message.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return responses[hash % responses.length];
}

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const body = await request.json();
  const { message, conversationId } = body as {
    message: string;
    conversationId?: string;
  };

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  // Validate slug
  const validSlugs: ArchetypeSlug[] = [
    "development_director",
    "marketing_director",
    "executive_assistant",
    "programs_director",
    "hr_volunteer_coordinator",
    "events_director",
  ];

  if (!validSlugs.includes(slug as ArchetypeSlug)) {
    return NextResponse.json(
      { error: "Unknown team member" },
      { status: 404 }
    );
  }

  // Attempt real backend agent service
  try {
    const backendUrl = process.env.AGENT_SERVICE_URL;
    if (backendUrl) {
      const res = await fetch(`${backendUrl}/team/${slug}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, conversationId }),
        signal: AbortSignal.timeout(10_000),
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    }
  } catch {
    // Fall through to mock
  }

  // Simulate realistic latency
  await new Promise((resolve) =>
    setTimeout(resolve, 800 + Math.random() * 800)
  );

  const responseContent = getMockResponse(slug, message);

  return NextResponse.json({
    id: crypto.randomUUID(),
    role: "assistant",
    content: responseContent,
    timestamp: new Date().toISOString(),
    conversationId: conversationId ?? crypto.randomUUID(),
  });
}
