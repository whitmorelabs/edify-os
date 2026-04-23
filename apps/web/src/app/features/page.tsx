import Link from "next/link";
import { ArrowRight, Landmark, Megaphone, CalendarCheck, BookOpen, Heart, PartyPopper } from "lucide-react";
import SpialNavbar from "@/components/spial-navbar";
import SpialFooter from "@/components/spial-footer";
import { Button } from "@/components/ui";

export const metadata = {
  title: "Features | Edify OS",
  description: "Seven AI directors with deep domain expertise, distinct personalities, and specialized subagents. See every feature, every capability, every workflow.",
};

const directors = [
  {
    icon: Landmark,
    name: "Development Director",
    slug: "development-director",
    personality: "Warm but data-driven. Ranks everything by ROI, probability, and deadline. Never presents raw data without a recommendation.",
    capabilities: [
      "Grant research, eligibility analysis, and opportunity ranking by mission fit and deadline",
      "Full proposal writing -- LOIs, applications, budget narratives, and evaluation plans",
      "Donor cultivation strategies, stewardship workflows, and personalized outreach",
      "CRM health analysis, donor segmentation, and re-engagement recommendations",
      "Fundraising campaign design for annual fund, capital campaigns, and planned giving",
      "Board fundraising engagement and impact reporting for funders",
    ],
    workflow: {
      title: "Example workflow: End-of-quarter fundraising push",
      steps: [
        "Ask: \"We need $50K by September 30. What should we focus on?\"",
        "Development Director ranks top 3 paths with dollar projections and probability estimates",
        "Grant Research subagent scans for open opportunities matching your mission",
        "Donor Outreach subagent drafts personalized re-engagement letters for lapsed mid-level donors",
        "You review, approve, and send -- all in one session",
      ],
    },
  },
  {
    icon: Megaphone,
    name: "Marketing & Communications Director",
    slug: "marketing-director",
    personality: "Creative-first, data-informed. Leads with the angle, then backs it with audience data. Thinks in stories, hooks, and emotional resonance.",
    capabilities: [
      "Brand messaging, voice development, and style guide management",
      "Platform-specific social content for LinkedIn, Instagram, Facebook, and more",
      "Email campaigns, newsletters, welcome sequences, and drip campaigns",
      "Crisis communications, media relations, and public statements",
      "Content strategy: blogs, press releases, case studies, annual reports",
      "Campaign performance analysis with actionable optimization recommendations",
    ],
    workflow: {
      title: "Example workflow: Promote an upcoming gala",
      steps: [
        "Ask: \"We need to promote our gala on social media\"",
        "Marketing Director proposes a 3-post sequence with creative concept and rationale",
        "Social Media subagent drafts platform-specific copy for LinkedIn, Instagram, and Facebook",
        "Analytics subagent pulls what has been resonating with your audience",
        "You pick the angle, approve the drafts, and schedule -- done",
      ],
    },
  },
  {
    icon: CalendarCheck,
    name: "Executive Assistant",
    slug: "executive-assistant",
    personality: "Chief-of-staff energy. Leads with the action item. Zero fluff. Always ends with a clear list of what you need to do.",
    capabilities: [
      "Email triage, prioritization, and response drafting",
      "Calendar coordination, conflict resolution, and scheduling",
      "Meeting preparation -- agendas, briefing notes, and pre-reads",
      "Board meeting logistics and materials preparation",
      "Task tracking, action item management, and follow-up reminders",
      "Cross-team coordination and routing requests to the right director",
    ],
    workflow: {
      title: "Example workflow: Prepare for a board meeting",
      steps: [
        "Ask: \"I have a board meeting next week. Help me prepare.\"",
        "EA drafts the agenda based on your last meeting's open items",
        "Meeting Prep subagent compiles briefing notes and discussion questions",
        "Task Management subagent surfaces any action items that are overdue",
        "EA sends reminders to board members and handles room/Zoom logistics",
      ],
    },
  },
  {
    icon: BookOpen,
    name: "Programs Director",
    slug: "programs-director",
    personality: "Evidence-based with a human-centered lens. Thinks in logic models, outcome data, and participant journeys. Always brings it back to the people served.",
    capabilities: [
      "Program design -- logic models, theories of change, eligibility criteria",
      "Outcome measurement frameworks and data collection instrument design",
      "Grant reporting -- narrative, outcome tables, and lessons learned sections",
      "Compliance monitoring -- funder deadlines, deliverable tracking, risk flags",
      "Needs assessment design and community gap analysis",
      "Quality improvement cycles and continuous learning frameworks",
    ],
    workflow: {
      title: "Example workflow: Respond to a funder report request",
      steps: [
        "Ask: \"The Johnson Foundation wants a progress report on our youth program.\"",
        "Programs Director pulls your outcome data and compares against grant deliverables",
        "Grant Reporting subagent drafts the narrative with data tables and participant stories",
        "Compliance Monitor subagent flags any deliverable gaps to address",
        "You review the draft, add your voice, and submit on time",
      ],
    },
  },
  {
    icon: Heart,
    name: "HR & Volunteer Coordinator",
    slug: "hr-volunteer-coordinator",
    personality: "Warmest voice on the team. Leads with people, not processes. Makes compliance feel approachable. References best practice frequently.",
    capabilities: [
      "Volunteer recruitment, role design, onboarding, and retention strategies",
      "Job description writing and equitable hiring process design",
      "Employee handbook and workplace policy development",
      "Performance review frameworks and feedback templates",
      "Training program design and orientation materials",
      "Volunteer hour tracking, certification management, and recognition programs",
    ],
    workflow: {
      title: "Example workflow: Recruit 20 volunteers for summer program",
      steps: [
        "Ask: \"We need to recruit 20 volunteers for our summer program.\"",
        "HR Director designs 3 distinct volunteer roles rather than one generic listing",
        "Volunteer Management subagent drafts role descriptions and onboarding checklist",
        "Training Design subagent builds the 2-hour orientation curriculum",
        "Marketing Director is looped in for recruitment social media posts",
      ],
    },
  },
  {
    icon: PartyPopper,
    name: "Events Director",
    slug: "events-director",
    personality: "High-energy and deadline-obsessed. Thinks backwards from the event date. Always in 'weeks out' mode. Equally focused on logistics and the experience.",
    capabilities: [
      "Reverse-engineered planning timelines from event date to today",
      "Run-of-show documents with every 15 minutes accounted for",
      "Vendor coordination, contract management, and logistics tracking",
      "Sponsorship package development and prospect outreach",
      "Event budget tracking and cost-per-attendee analysis",
      "Post-event ROI reporting and lessons-learned documentation",
    ],
    workflow: {
      title: "Example workflow: Plan an annual gala",
      steps: [
        "Ask: \"We want to host our annual gala in September.\"",
        "Events Director builds a 22-week reverse timeline with weekly milestones",
        "Event Planner subagent creates a full planning document with budget, vendors, and task list",
        "Sponsorship Manager subagent develops tiered packages and outreach emails",
        "Development Director is looped in for fundraising strategy within the event",
      ],
    },
  },
];

export default function FeaturesPage() {
  return (
    <div className="bg-bg-0 min-h-screen">
      <SpialNavbar />

      {/* Hero */}
      <section className="bg-bg-plum-1 py-20">
        <div className="spial-container mx-auto text-center">
          <div className="eyebrow mb-4">Features</div>
          <h1 className="text-fg-1 text-[36px] md:text-[52px] font-semibold leading-[1.2] tracking-[-0.02em] mb-5">
            Six directors. Every operational role covered.
          </h1>
          <p className="text-fg-2 text-lg leading-[1.7] max-w-[700px] mx-auto">
            Each one has deep expertise, a distinct personality, and a team of specialized subagents. This is not a generic AI assistant. This is your leadership team.
          </p>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="py-16 bg-bg-0">
        <div className="spial-container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Decision Lab",
                desc: "Type in any scenario and get 6 expert perspectives in seconds. Marketing rates the messaging, Programs checks mission fit, and your EA synthesizes the consensus.",
              },
              {
                title: "Proactive heartbeats",
                desc: "Your team checks in every few hours. Grant deadlines, donor engagement gaps, budget variances -- surfaced before they become problems.",
              },
              {
                title: "Subagent delegation",
                desc: "Each director delegates to specialized subagents for deep work. The Development Director has 5. The Marketing Director has 5. Real work, not just advice.",
              },
            ].map((f, i) => (
              <div key={i} className="bg-bg-2 shadow-elev-1 rounded-xl p-7">
                <h3 className="text-lg font-semibold text-brand-500 mb-3">{f.title}</h3>
                <p className="text-fg-3 text-sm leading-[1.7]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Per-director sections */}
      <section className="py-20 bg-bg-1">
        <div className="spial-container mx-auto">
          <div className="space-y-16">
            {directors.map((d) => (
              <div key={d.slug} className="bg-bg-2 shadow-elev-1 rounded-2xl overflow-hidden">
                <div className="bg-bg-3 px-8 py-6 border-b border-bg-0/50">
                  <div className="flex items-center gap-4">
                    <d.icon className="w-8 h-8 text-brand-500" />
                    <div>
                      <h2 className="text-2xl font-semibold text-fg-1">{d.name}</h2>
                      <p className="text-fg-3 text-sm mt-1">{d.personality}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                  {/* Capabilities */}
                  <div className="p-8 border-r border-bg-3">
                    <h3 className="text-lg font-semibold text-fg-1 mb-4">Capabilities</h3>
                    <ul className="list-none space-y-3">
                      {d.capabilities.map((c, j) => (
                        <li key={j} className="flex gap-3 text-sm text-fg-2 leading-[1.6]">
                          <span className="text-brand-500 font-bold shrink-0 mt-0.5">&#10003;</span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Workflow */}
                  <div className="p-8 bg-bg-1">
                    <h3 className="text-lg font-semibold text-fg-1 mb-4">{d.workflow.title}</h3>
                    <ol className="list-none space-y-3">
                      {d.workflow.steps.map((step, j) => (
                        <li key={j} className="flex gap-3 text-sm text-fg-2 leading-[1.6]">
                          <span className="text-brand-500 font-bold shrink-0 min-w-[20px]">{j + 1}.</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                    <Link
                      href={`/agents/${d.slug}`}
                      className="inline-flex items-center gap-2 mt-6 text-sm font-semibold no-underline text-brand-500 hover:opacity-70 transition-opacity"
                    >
                      Meet the {d.name}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-bg-0">
        <div className="spial-container mx-auto text-center">
          <h2 className="text-[28px] md:text-[34px] font-semibold tracking-[-0.01em] text-fg-1 mb-4">
            Ready to see them in action?
          </h2>
          <p className="text-fg-3 leading-[1.7] max-w-[500px] mx-auto mb-8">
            Walk through a real demo or get started and brief your team today.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/signup" className="no-underline">
              <Button variant="primary" size="lg" trailingIcon={<ArrowRight className="w-4 h-4" />}>
                Get started
              </Button>
            </Link>
            <Link href="/demo" className="no-underline">
              <Button variant="secondary" size="lg">
                See the demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SpialFooter />
    </div>
  );
}
