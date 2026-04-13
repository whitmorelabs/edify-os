import SpialNavbar from "@/components/spial-navbar";
import SpialFooter from "@/components/spial-footer";
import SectionLabel from "@/components/section-label";

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
    category: "Team Communication",
    desc: "Receive heartbeat updates and team check-ins in your Slack workspace. Post AI-drafted content for team review before publishing.",
    status: "Coming Soon",
  },
  {
    name: "Instagram",
    category: "Social Media",
    desc: "The Marketing Director monitors engagement data, suggests content calendar items, and drafts posts formatted for Instagram's character limits and visual style.",
    status: "Coming Soon",
  },
  {
    name: "Facebook",
    category: "Social Media",
    desc: "Publish approved content, track engagement metrics, and let the Marketing Director analyze what is resonating with your community audience.",
    status: "Coming Soon",
  },
  {
    name: "LinkedIn",
    category: "Social Media",
    desc: "Professional content for board members, major donors, and sector partners. The Marketing Director writes in LinkedIn's native tone and format.",
    status: "Coming Soon",
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
    category: "Grant Research",
    desc: "Search funder profiles, track foundation priorities, and let the Development Director identify matches before opportunities close.",
    status: "Planned",
  },
  {
    name: "Grants.gov",
    category: "Grant Research",
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

const statusColors: Record<string, string> = {
  "Available": "bg-emerald-100 text-emerald-700",
  "Coming Soon": "bg-amber-100 text-amber-700",
  "Planned": "bg-[#f5f0ff] text-[#7c3aed]",
};

export default function IntegrationsPage() {
  return (
    <div className="spial-page">
      <SpialNavbar />

      {/* Hero */}
      <section className="bg-[#1a2b32] py-20">
        <div className="spial-container mx-auto text-center">
          <SectionLabel text="Integrations" />
          <h1 className="text-white text-[36px] md:text-[52px] font-semibold leading-[1.2] mb-5">
            Your team works where you work.
          </h1>
          <p className="text-white/80 text-lg leading-[1.7] max-w-[700px] mx-auto">
            Edify OS connects to the tools your organization already uses. The more your team can see, the more value they can surface.
          </p>
        </div>
      </section>

      {/* Integration principle */}
      <section className="py-14 bg-[#392e3b] text-white">
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
              <div key={i} className="bg-white/10 rounded-xl p-7 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-3">{f.title}</h3>
                <p className="text-white/70 text-sm leading-[1.7]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Grid */}
      <section className="py-20 bg-[#f7f6f5]">
        <div className="spial-container mx-auto">
          <h2 className="text-[28px] md:text-[34px] font-medium text-black mb-4 text-center">
            Supported integrations
          </h2>
          <p className="text-center text-[#666] leading-[1.7] max-w-[600px] mx-auto mb-[50px]">
            Available integrations work today. Coming Soon are in active development. Planned are on the roadmap.
          </p>

          {/* Status legend */}
          <div className="flex flex-wrap gap-4 justify-center mb-10">
            {["Available", "Coming Soon", "Planned"].map((s) => (
              <span key={s} className={`text-sm px-3 py-1 rounded-full font-medium ${statusColors[s]}`}>
                {s}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integ) => (
              <div
                key={integ.name}
                className="bg-white rounded-xl p-7 shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-[#f0f0f0]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-black text-lg">{integ.name}</h3>
                    <p className="text-xs text-[#999] mt-0.5">{integ.category}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ml-3 shrink-0 ${statusColors[integ.status]}`}>
                    {integ.status}
                  </span>
                </div>
                <p className="text-sm text-[#666] leading-[1.6]">{integ.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-[#666] leading-[1.7] mb-4">
              Don&apos;t see an integration you need? Let us know.
            </p>
            <a
              href="mailto:connect@edifyanother.com"
              className="text-[#8B5CF6] font-medium no-underline hover:underline"
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
