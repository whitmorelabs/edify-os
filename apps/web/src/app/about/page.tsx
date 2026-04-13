import Link from "next/link";
import { ArrowRight, Film, Tv, Users, Lightbulb } from "lucide-react";
import SpialNavbar from "@/components/spial-navbar";
import SpialFooter from "@/components/spial-footer";
import SectionLabel from "@/components/section-label";
import Placeholder from "@/components/placeholder";

export const metadata = {
  title: "About | Edify OS",
  description: "Edify OS is built by Edify, a creative impact studio in Beaufort, SC. We make cinematic films and immersive XR/VR for nonprofits -- and we built Edify OS to fix what we kept seeing.",
};

export default function AboutPage() {
  return (
    <div className="spial-page">
      <SpialNavbar />

      {/* Hero */}
      <section className="bg-[#1a2b32] py-20">
        <div className="spial-container mx-auto text-center">
          <SectionLabel text="Our Story" />
          <h1 className="text-white text-[36px] md:text-[52px] font-semibold leading-[1.2] mb-5">
            We didn&apos;t set out to build software.
          </h1>
          <p className="text-white/80 text-lg leading-[1.7] max-w-[700px] mx-auto">
            We set out to tell the stories of people doing extraordinary work with impossible constraints. Along the way, we noticed something we couldn&apos;t ignore.
          </p>
        </div>
      </section>

      {/* Origin Story */}
      <section className="py-20 bg-[#f7f6f5]">
        <div className="spial-container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[60px] items-center">
            <div>
              <h2 className="text-[28px] md:text-[34px] font-medium text-black mb-5">
                We saw the same story, over and over.
              </h2>
              <p className="leading-[1.7] text-[#333] mb-4">
                Edify is a creative impact studio based in Beaufort, SC. For years, we have made cinematic films and immersive XR/VR experiences for nonprofits across the Southeast. Youth programs. Community health organizations. Cultural institutions. Conservation groups.
              </p>
              <p className="leading-[1.7] text-[#333] mb-4">
                And in every single one, we met the same person. Passionate about the mission. Brilliant at their work. Completely buried in operational tasks they could not afford to delegate.
              </p>
              <p className="leading-[1.7] text-[#333] mb-4">
                The Executive Director writing grant proposals until midnight. The development manager tracking every donor in a spreadsheet they built themselves. The programs director pulling double duty as HR, communications, and event planner.
              </p>
              <p className="leading-[1.7] text-[#333]">
                They were not failing. They were just being asked to do the work of five people with the budget for one. That is not a people problem. It is a resource problem. And resource problems have solutions.
              </p>
            </div>
            <Placeholder className="w-full aspect-[4/3]" label="Edify Studio" src="https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800" />
          </div>
        </div>
      </section>

      {/* The Insight */}
      <section className="py-20 bg-[#f7f6f5]">
        <div className="spial-container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[60px] items-center">
            <Placeholder className="w-full aspect-[4/3]" label="The Problem" />
            <div>
              <SectionLabel text="The Insight" align="left" />
              <h2 className="text-[28px] md:text-[34px] font-medium text-black mb-5">
                You can&apos;t hire your way out. But you can build your way forward.
              </h2>
              <p className="leading-[1.7] text-[#333] mb-4">
                Restricted grant funding means most nonprofits cannot use grants to hire operational staff. General operating support is rare. And even when orgs grow their revenue, the operational roles -- development, marketing, finance, HR, events -- are the last to get funded.
              </p>
              <p className="leading-[1.7] text-[#333] mb-4">
                We asked a different question: what if we built the team they couldn&apos;t hire?
              </p>
              <p className="leading-[1.7] text-[#333]">
                Edify OS is the answer. Six AI directors, each with deep expertise, a distinct personality, and a team of specialized subagents doing the work in the background. Not a chatbot. An actual team that shows up, checks in, and does the job.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What Edify Does */}
      <section className="py-20 bg-[#392e3b] text-white">
        <div className="spial-container mx-auto">
          <div className="text-center mb-[50px]">
            <SectionLabel text="Our Work" />
            <h2 className="text-[28px] md:text-[34px] font-medium text-white mb-4">
              Stories matter. So does the work that supports them.
            </h2>
            <p className="text-white/70 leading-[1.7] max-w-[600px] mx-auto">
              Edify&apos;s creative work and Edify OS are two sides of the same mission: help nonprofits do more good in the world.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Film,
                title: "Cinematic Film",
                desc: "Documentary-quality impact films that move donors, funders, and communities to action.",
              },
              {
                icon: Tv,
                title: "XR & VR Experiences",
                desc: "Immersive experiences that put audiences inside your mission -- from gala activations to awareness campaigns.",
              },
              {
                icon: Users,
                title: "Youth CINEMA",
                desc: "Filmmaking programs for young people, building storytelling skills and creative confidence.",
              },
              {
                icon: Lightbulb,
                title: "Edify OS",
                desc: "AI-powered directors that fill the operational gaps nonprofits can&apos;t afford to staff.",
              },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 rounded-xl p-7 border border-white/10">
                <s.icon className="w-8 h-8 text-[#8B5CF6] mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-white/70 text-sm leading-[1.6]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 bg-[#f7f6f5]">
        <div className="spial-container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[60px] items-start">
            <div>
              <SectionLabel text="Find Us" align="left" />
              <h2 className="text-[28px] md:text-[34px] font-medium text-black mb-5">
                We&apos;re in Beaufort, SC.
              </h2>
              <p className="leading-[1.7] text-[#333] mb-8">
                We are a small, committed team that has been embedded in the nonprofit world for years. We build what we build because we have sat across the table from the people it serves.
              </p>
              <ul className="list-none space-y-4">
                <li className="flex gap-3 text-[#333]">
                  <span className="text-[#8B5CF6] font-bold shrink-0">@</span>
                  <a href="mailto:connect@edifyanother.com" className="text-[#8B5CF6] no-underline hover:underline">
                    connect@edifyanother.com
                  </a>
                </li>
                <li className="flex gap-3 text-[#333]">
                  <span className="text-[#8B5CF6] font-bold shrink-0">#</span>
                  <a href="tel:+18439294185" className="no-underline text-[#333] hover:text-[#8B5CF6]">
                    (843) 929-4185
                  </a>
                </li>
                <li className="flex gap-3 text-[#333]">
                  <span className="text-[#8B5CF6] font-bold shrink-0">~</span>
                  500 Carteret St, Beaufort, SC 29902
                </li>
                <li className="flex gap-3 text-[#333]">
                  <span className="text-[#8B5CF6] font-bold shrink-0">&gt;</span>
                  <a href="https://edifyanother.com" target="_blank" rel="noopener noreferrer" className="text-[#8B5CF6] no-underline hover:underline">
                    edifyanother.com
                  </a>
                </li>
              </ul>
            </div>
            <div className="bg-white p-10 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
              <h3 className="text-2xl font-medium text-black mb-4">Ready to meet your team?</h3>
              <p className="text-[#666] leading-[1.7] mb-6">
                Edify OS is built for nonprofit leaders who know they can do more -- if they just had the support to do it.
              </p>
              <div className="flex flex-col gap-3">
                <Link href="/signup" className="spial-btn no-underline inline-flex justify-center">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/demo" className="block text-center px-6 py-3 rounded-full border border-[#333] text-[#333] text-sm font-medium no-underline transition-colors duration-300 hover:bg-[#333] hover:text-white">
                  See the Demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SpialFooter />
    </div>
  );
}
