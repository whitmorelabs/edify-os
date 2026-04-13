import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SpialNavbar from "@/components/spial-navbar";
import SpialFooter from "@/components/spial-footer";
import SectionLabel from "@/components/section-label";

export const metadata = {
  title: "Demo | Edify OS",
  description: "A guided walkthrough of the Edify OS nonprofit user portal. See the dashboard, meet your team, and understand how the whole thing works.",
};

function ScreenshotArea({ label }: { label: string }) {
  return (
    <div className="w-full aspect-[16/9] bg-[#1a2b32] rounded-xl border border-white/10 flex items-center justify-center">
      <div className="text-white/30 text-sm font-medium">{label}</div>
    </div>
  );
}

export default function DemoPage() {
  return (
    <div className="spial-page">
      <SpialNavbar />

      {/* Hero */}
      <section className="bg-[#1a2b32] py-20">
        <div className="spial-container mx-auto text-center">
          <SectionLabel text="Product Demo" />
          <h1 className="text-white text-[36px] md:text-[52px] font-semibold leading-[1.2] mb-5">
            See what it looks like when your team shows up.
          </h1>
          <p className="text-white/80 text-lg leading-[1.7] max-w-[700px] mx-auto">
            A guided walkthrough of the Edify OS portal. Five minutes, five features, and a clear picture of what changes when your operational gaps are covered.
          </p>
        </div>
      </section>

      {/* Section 1: Dashboard */}
      <section className="py-20 bg-[#f7f6f5]">
        <div className="spial-container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[60px] items-center">
            <div>
              <div className="text-xs text-[#8B5CF6] font-semibold uppercase tracking-wider mb-3">Step 1</div>
              <h2 className="text-[28px] md:text-[34px] font-medium text-black mb-5">
                Your team at a glance.
              </h2>
              <p className="leading-[1.7] text-[#333] mb-4">
                The dashboard shows you all six directors, their recent activity, and any heartbeat updates they have surfaced. You can see at a glance what each team member has been working on and where something needs your attention.
              </p>
              <p className="leading-[1.7] text-[#333]">
                The inbox lives here too -- every proactive check-in, every flagged deadline, every recommendation from your team waiting for your review.
              </p>
            </div>
            <ScreenshotArea label="Dashboard Overview" />
          </div>
        </div>
      </section>

      {/* Section 2: Team Chat */}
      <section className="py-20 bg-[#f7f6f5]">
        <div className="spial-container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[60px] items-center">
            <ScreenshotArea label="Team Chat -- Development Director" />
            <div>
              <div className="text-xs text-[#8B5CF6] font-semibold uppercase tracking-wider mb-3">Step 2</div>
              <h2 className="text-[28px] md:text-[34px] font-medium text-black mb-5">
                Ask your team anything.
              </h2>
              <p className="leading-[1.7] text-[#333] mb-4">
                Select a team member and start a conversation. Each director responds in their own voice. The Development Director gives you ranked options with dollar amounts and deadlines. The Marketing Director leads with the angle. The Programs Director brings the participant perspective before anything else.
              </p>
              <p className="leading-[1.7] text-[#333]">
                Conversations are saved so context carries forward. Your team remembers what they have already told you and builds on it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Decision Lab */}
      <section className="py-20 bg-[#f7f6f5]">
        <div className="spial-container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[60px] items-center">
            <div>
              <div className="text-xs text-[#8B5CF6] font-semibold uppercase tracking-wider mb-3">Step 3</div>
              <h2 className="text-[28px] md:text-[34px] font-medium text-black mb-5">
                6 perspectives. One decision.
              </h2>
              <p className="leading-[1.7] text-[#333] mb-4">
                The Decision Lab is where you run any major decision, scenario, or draft past the full team at once. Type in a question -- "Should we cancel our annual gala?" or "Review this donor email before I send it" -- and every director weighs in simultaneously.
              </p>
              <p className="leading-[1.7] text-[#333] mb-4">
                Each response shows their stance (supportive, cautious, or opposing), their reasoning, and their specific recommendation. The synthesis panel summarizes where the team agrees, where they disagree, and what to do next.
              </p>
              <p className="leading-[1.7] text-[#555] text-sm">
                All 6 responses arrive in under 10 seconds.
              </p>
            </div>
            <ScreenshotArea label="Decision Lab -- 6 Perspectives" />
          </div>
        </div>
      </section>

      {/* Section 4: Heartbeats */}
      <section className="py-20 bg-[#f7f6f5]">
        <div className="spial-container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[60px] items-center">
            <ScreenshotArea label="Heartbeat Inbox" />
            <div>
              <div className="text-xs text-[#8B5CF6] font-semibold uppercase tracking-wider mb-3">Step 4</div>
              <h2 className="text-[28px] md:text-[34px] font-medium text-black mb-5">
                Your team checks in proactively.
              </h2>
              <p className="leading-[1.7] text-[#333] mb-4">
                Every few hours, your directors scan their domains and surface what matters. Grant deadlines. Donor engagement gaps. Budget variances. Campaign performance. Upcoming event milestones.
              </p>
              <p className="leading-[1.7] text-[#333] mb-4">
                Each heartbeat arrives with a summary, why it matters, and a suggested action. You can respond to start a deeper conversation with that director, or dismiss if it is not relevant right now.
              </p>
              <p className="leading-[1.7] text-[#555] text-sm">
                Directors only check in when they have something worth saying. No noise.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Org Briefing */}
      <section className="py-20 bg-[#f7f6f5]">
        <div className="spial-container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[60px] items-center">
            <div>
              <div className="text-xs text-[#8B5CF6] font-semibold uppercase tracking-wider mb-3">Step 5</div>
              <h2 className="text-[28px] md:text-[34px] font-medium text-black mb-5">
                Get started in 5 minutes.
              </h2>
              <p className="leading-[1.7] text-[#333] mb-4">
                The org briefing is how you onboard your team. It walks through four steps: your mission, your programs, your brand voice, and any documents you want your team to know about.
              </p>
              <p className="leading-[1.7] text-[#333] mb-4">
                This context gets injected into every conversation, every heartbeat, every Decision Lab response. Your team knows your org before the first conversation starts.
              </p>
              <p className="leading-[1.7] text-[#555] text-sm">
                The more context you give, the more specific and useful every response becomes.
              </p>
            </div>
            <ScreenshotArea label="Org Briefing -- 4-Step Onboarding" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#392e3b] text-white">
        <div className="spial-container mx-auto text-center">
          <h2 className="text-[28px] md:text-[34px] font-medium text-white mb-4">
            Ready to meet your team?
          </h2>
          <p className="text-white/70 leading-[1.7] max-w-[500px] mx-auto mb-8">
            Brief them on your mission. Let them handle the operational layer. Start leading.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/signup" className="spial-btn no-underline">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 rounded-full border border-white/30 text-white text-sm font-medium no-underline transition-colors duration-300 hover:bg-white/10"
            >
              Talk to Us First
            </Link>
          </div>
        </div>
      </section>

      <SpialFooter />
    </div>
  );
}
