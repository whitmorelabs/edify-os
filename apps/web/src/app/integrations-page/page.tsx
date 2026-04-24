import SpialNavbar from "@/components/spial-navbar";
import SpialFooter from "@/components/spial-footer";

export const metadata = {
  title: "Integrations | Edify OS",
  description: "Connect the tools your team already uses. Calendar, email, social media, CRMs, grant databases, and more.",
};

const integrations = [
  {
    name: "Google Calendar",
    category: "Scheduling",
    desc: "Your Executive Assistant reads your calendar to prep for upcoming meetings, schedule requests, and send reminders before important deadlines.",
    status: "Available",
  },
  {
    name: "Gmail",
    category: "Email",
    desc: "Triage your inbox, draft responses, flag urgent items, and surface follow-ups that have been sitting too long.",
    status: "Available",
  },
  {
    name: "Slack",
    category: "Team communication",
    desc: "Receive heartbeat updates and team check-ins in your Slack workspace. Post AI-drafted content for team review before publishing.",
    status: "Coming soon",
  },
  {
    name: "Instagram",
    category: "Social media",
    desc: "The Marketing Director monitors engagement data, suggests content calendar items, and drafts posts formatted for Instagram's character limits and visual style.",
    status: "Coming soon",
  },
  {
    name: "Facebook",
    category: "Social media",
    desc: "Publish approved content, track engagement metrics, and let the Marketing Director analyze what is resonating with your community audience.",
    status: "Coming soon",
  },
  {
    name: "LinkedIn",
    category: "Social media",
    desc: "Professional content for board members, major donors, and sector partners. The Marketing Director writes in LinkedIn's native tone and format.",
    status: "Coming soon",
  },
  {
    name: "Salesforce Nonprofit Success Pack",
    category: "CRM",
    desc: "Sync donor data, track giving history, and let the Development Director surface re-engagement opportunities and flag stale records.",
    status: "Planned",
  },
  {
    name: "Bloomerang",
    category: "CRM",
    desc: "Connect your donor management system so the Development Director has real giving history, engagement scores, and cultivation timelines.",
    status: "Planned",
  },
  {
    name: "Little Green Light",
    category: "CRM",
    desc: "Pull donor profiles, relationship notes, and giving data directly into your Development Director's context.",
    status: "Planned",
  },
  {
    name: "Candid / Foundation Directory",
    category: "Grant research",
    desc: "Search funder profiles, track foundation priorities, and let the Development Director identify matches before opportunities close.",
    status: "Planned",
  },
  {
    name: "Grants.gov",
    category: "Grant research",
    desc: "Monitor federal grant opportunities matching your mission. Never miss a federal deadline again.",
    status: "Planned",
  },
  {
    name: "QuickBooks",
    category: "Finance",
    desc: "Connect your financial data so cash flow projections and budget-to-actual reports are based on real numbers, not estimates.",
    status: "Planned",
  },
];

const statusStyles: Record<string, string> = {
  "Available": "bg-[#4ADE80]/15 text-[#4ADE80]",
  "Coming soon": "bg-[#FCD34D]/15 text-[#FCD34D]",
  "Planned": "bg-brand-500/15 text-brand-500",
};

export default function IntegrationsPage() {
  return (
    <div className="bg-bg-0 min-h-screen">
      <SpialNavbar />

      {/* Hero */}
      <section
        className="relative overflow-hidden py-28"
        style={{ background: "var(--hero-gradient-marketing), var(--bg-plum-1)" }}
      >
        <div className="spial-container mx-auto text-center relative z-10">
          <div className="eyebrow mb-4">Integrations</div>
          <h1 className="text-fg-1 text-[36px] md:text-[52px] font-semibold leading-[1.2] tracking-[-0.02em] mb-6">
            Your team works where you work.
          </h1>
          <p className="text-fg-2 text-lg leading-[1.75] max-w-[700px] mx-auto">
            Edify OS connects to the tools your organization already uses. The more your team can see, the more value they can surface.
          </p>
        </div>
      </section>

      {/* Integration principle */}
      <section className="py-20 bg-bg-0">
        <div className="spial-container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Context makes everything better",
                desc: "When your Development Director can see real donor history from your CRM, their recommendations go from generic to specific. The more context, the more value.",
              },
              {
                title: "You control what connects",
                desc: "Every integration is opt-in. Connect what makes sense for your org. Your team adapts to what is available and works with what you give them.",
              },
              {
                title: "Proactive scanning needs data",
                desc: "Heartbeat check-ins are most powerful when they have real data to scan. Grant deadlines from Candid. Email volume from Gmail. Campaign data from social platforms.",
              },
            ].map((f, i) => (
              <div key={i} className="bg-bg-2 shadow-elev-1 rounded-xl p-7">
                <h3 className="text-lg font-semibold text-fg-1 mb-3">{f.title}</h3>
                <p className="text-fg-3 text-sm leading-[1.7]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Grid */}
      <section className="py-28 bg-bg-1">
        <div className="spial-container mx-auto">
          <h2 className="text-[28px] md:text-[34px] font-semibold tracking-[-0.01em] text-fg-1 mb-4 text-center">
            Supported integrations
          </h2>
          <p className="text-center text-fg-3 leading-[1.7] max-w-[600px] mx-auto mb-14">
            Available integrations work today. Coming soon are in active development. Planned are on the roadmap.
          </p>

          {/* Status legend */}
          <div className="flex flex-wrap gap-4 justify-center mb-12">
            {["Available", "Coming soon", "Planned"].map((s) => (
              <span key={s} className={`text-sm px-3 py-1 rounded-full font-medium ${statusStyles[s]}`}>
                {s}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {integrations.map((integ) => (
              <div
                key={integ.name}
                className="bg-bg-2 shadow-elev-1 rounded-xl p-7"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-fg-1 text-lg">{integ.name}</h3>
                    <p className="text-xs text-fg-4 mt-0.5">{integ.category}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ml-3 shrink-0 ${statusStyles[integ.status]}`}>
                    {integ.status}
                  </span>
                </div>
                <p className="text-sm text-fg-3 leading-[1.6]">{integ.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-fg-3 leading-[1.7] mb-4">
              Don&apos;t see an integration you need? Let us know.
            </p>
            <a
              href="mailto:connect@edifyanother.com"
              className="text-brand-500 font-medium no-underline hover:underline"
            >
              connect@edifyanother.com
            </a>
          </div>
        </div>
      </section>

      <SpialFooter />
    </div>
  );
}
