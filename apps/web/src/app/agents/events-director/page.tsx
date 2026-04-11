"use client";

import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  CalendarDays,
} from "lucide-react";
import SpialNavbar from "@/components/spial-navbar";
import SpialFooter from "@/components/spial-footer";

/* ── Helpers ─────────────────────────────────────────────────── */
function SectionLabel({ text, centered = false }: { text: string; centered?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 text-sm font-semibold text-[#d2b4fe] mb-4 uppercase ${centered ? "justify-center" : ""}`}>
      <Sparkles className="w-4 h-4" />
      {text}
    </div>
  );
}

function Placeholder({ className = "", label }: { className?: string; label?: string }) {
  return (
    <div className={`bg-[#e5e5e5] rounded-xl flex items-center justify-center ${className}`}>
      {label && <span className="text-[#999] text-sm select-none">{label}</span>}
    </div>
  );
}

/* ── Page Data ───────────────────────────────────────────────── */
const archetype = {
  name: "Events Director",
  role: "Plan, produce, and evaluate events including galas, fundraisers, community events, and conferences.",
  personality: "High-energy and organized. Thinks in timelines and run-of-show documents. Deadline-obsessed. Balances experience vision with practical constraints. Works backwards from the event date.",
  coreQuestion: "What will they remember?",
  responseStyle: "Reverse timelines",
  responsibilities: [
    "Create comprehensive event plans with timelines and budgets",
    "Build minute-by-minute run-of-show documents",
    "Develop sponsorship packages and prospectus materials",
    "Manage vendor lists and task checklists",
    "Design attendee surveys and calculate event ROI",
    "Produce debrief reports with lessons learned",
  ],
  subagents: [
    { name: "Event Planner", description: "Creates comprehensive event plans with reverse-engineered timelines, detailed budgets, vendor lists, and task checklists for flawless execution." },
    { name: "Run of Show", description: "Builds minute-by-minute event schedules, stage cue sheets, and day-of documents so every moment runs on time." },
    { name: "Sponsorship Manager", description: "Develops tiered sponsorship packages, creates professional prospectus materials, and drafts personalized sponsor outreach." },
    { name: "Post-Event Eval", description: "Designs attendee satisfaction surveys, calculates comprehensive event ROI, and produces debrief reports with actionable improvements." },
  ],
  tools: [
    { name: "create_event_timeline", params: "event_name, event_date, event_type, planning_start_date", description: "Generate a reverse-engineered planning timeline working backwards from event day" },
    { name: "build_run_of_show", params: "event_name, start_time, end_time, segments, interval_minutes", description: "Create a detailed minute-by-minute run-of-show document for event day" },
    { name: "calculate_event_roi", params: "event_name, total_revenue, total_expenses, attendance, volunteer_hours", description: "Calculate comprehensive event ROI including direct and indirect value" },
    { name: "generate_sponsor_package", params: "event_name, tiers, audience_size", description: "Create a professional tiered sponsorship prospectus with benefits and pricing" },
  ],
  scenarios: [
    { title: "Plan a 500-person annual gala", description: "The Events Director creates a 16-week reverse timeline, builds a $85K budget with contingency, designs 4 sponsorship tiers totaling $45K in revenue, and produces a minute-by-minute run-of-show for the 4-hour event." },
    { title: "Organize a community resource fair", description: "Plans a free outdoor event for 300 community members with 25 vendor booths, volunteer coordination for 40 helpers, a family-friendly activity schedule, and a post-event survey to measure community impact." },
    { title: "Evaluate a fundraising dinner's success", description: "Calculates that the $120/plate dinner raised $67K net (after $18K expenses), achieved 92% satisfaction, secured 14 new major donor prospects, and recommends 5 changes to increase ROI by 30% next year." },
  ],
};

/* ── Page Component ──────────────────────────────────────────── */
export default function EventsDirectorPage() {
  return (
    <div className="spial-page">
      <SpialNavbar />

      {/* Hero */}
      <section className="bg-[#1a2b32] py-20 md:py-24 relative overflow-hidden">
        <div className="spial-container relative z-[1]">
          <div className="flex flex-col items-center text-center">
            <CalendarDays className="w-16 h-16 text-[#d2b4fe] mb-6" />
            <h1 className="text-white text-[36px] md:text-[52px] font-semibold leading-[1.2] mb-5">
              {archetype.name}
            </h1>
            <p className="text-white/80 text-lg mb-4 max-w-[600px] leading-[1.7]">
              {archetype.role}
            </p>
            <p className="text-white/60 text-base italic max-w-[500px] mb-8">
              &ldquo;{archetype.personality}&rdquo;
            </p>
            <button className="spial-btn">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* What They Do */}
      <section className="py-20 md:py-20 bg-[#f7f6f5]">
        <div className="spial-container">
          <SectionLabel text="Responsibilities" />
          <h2 className="text-[28px] md:text-[34px] font-medium text-black mb-5">
            What {archetype.name} Does
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[60px] items-center mt-10">
            <div>
              <ul className="list-none">
                {archetype.responsibilities.map((r, i) => (
                  <li
                    key={i}
                    className="flex gap-4 mb-4 text-base before:content-['\2713'] before:text-[#d2b4fe] before:font-bold before:text-lg before:shrink-0"
                  >
                    {r}
                  </li>
                ))}
              </ul>
              <Link
                href="#"
                className="text-[#d2b4fe] no-underline font-medium inline-flex items-center gap-2 mt-5 transition-colors duration-300 hover:text-[#c9a3f3]"
              >
                Explore More
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <Placeholder className="w-full aspect-[4/3]" label="Events Director" />
          </div>
        </div>
      </section>

      {/* Subagents */}
      <section className="py-20 md:py-20 bg-[#f7f6f5]">
        <div className="spial-container">
          <SectionLabel text="Subagents" />
          <h2 className="text-[28px] md:text-[34px] font-medium text-black mb-10">
            The Team Behind the {archetype.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[30px]">
            {archetype.subagents.map((s, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-[30px] shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
              >
                <h3 className="text-xl font-semibold text-black mb-3">{s.name}</h3>
                <p className="text-[15px] text-[#666] leading-[1.6]">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools */}
      <section className="py-20 md:py-20 bg-[#392e3b] text-white">
        <div className="spial-container">
          <h2 className="text-[28px] md:text-[34px] font-medium text-white mb-10 text-center">
            Specialized Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[30px]">
            {archetype.tools.map((t, i) => (
              <div
                key={i}
                className="bg-white/10 backdrop-blur-[10px] rounded-xl p-[30px] border border-white/10"
              >
                <h3 className="text-lg font-semibold text-[#d2b4fe] mb-2 font-mono">
                  {t.name}
                </h3>
                <p className="text-white/60 text-sm mb-3 font-mono">
                  ({t.params})
                </p>
                <p className="text-white/80 text-[15px] leading-[1.6]">{t.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 md:py-20 bg-[#f7f6f5]">
        <div className="spial-container">
          <SectionLabel text="Use Cases" />
          <h2 className="text-[28px] md:text-[34px] font-medium text-black mb-5">
            See {archetype.name} in Action
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[30px] mt-[50px]">
            {archetype.scenarios.map((s, i) => (
              <div
                key={i}
                className="bg-white rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_8px_16px_rgba(0,0,0,0.1)] cursor-pointer"
              >
                <div className="w-full h-[180px] bg-[#e5e5e5]" />
                <div className="p-[25px]">
                  <div className="text-xs text-[#d2b4fe] font-semibold uppercase mb-2.5">
                    Scenario {i + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-black mb-2.5">{s.title}</h3>
                  <p className="text-[14px] text-[#666] leading-[1.6]">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-[60px] bg-[#f7f6f5]">
        <div className="spial-container">
          <h2 className="text-[28px] md:text-[42px] font-medium text-black max-w-[600px] mx-auto mb-10 leading-[1.3]">
            Ready to hire your {archetype.name}?
          </h2>
          <button className="spial-btn">
            Get Started
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      <SpialFooter />
    </div>
  );
}
