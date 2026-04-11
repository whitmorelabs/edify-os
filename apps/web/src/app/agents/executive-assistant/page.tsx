"use client";

import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  ClipboardList,
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
  name: "Executive Assistant",
  role: "Support the leadership team by managing communications, schedules, and administrative tasks so they can focus on strategic work.",
  personality: "Concise and organized. Chief-of-staff energy. Leads with action items, not context. Anticipates the next question. Presents a single recommended action.",
  coreQuestion: "What needs to happen?",
  responseStyle: "Bullet-point briefs",
  responsibilities: [
    "Categorize and prioritize incoming communications",
    "Draft context-aware email responses",
    "Manage meeting scheduling and conflict detection",
    "Create structured meeting agendas and briefing notes",
    "Track action items and send reminders",
    "Extract action items from conversations and assign owners",
  ],
  subagents: [
    { name: "Email Triage", description: "Categorizes and prioritizes incoming communications, drafts context-aware responses, and flags urgent items for immediate attention." },
    { name: "Calendar Agent", description: "Suggests optimal meeting times, detects scheduling conflicts, and sends preparation reminders before important meetings." },
    { name: "Meeting Prep", description: "Creates structured agendas, pulls relevant documents, and generates concise briefing notes for every meeting." },
    { name: "Task Management", description: "Tracks action items across all conversations, sends timely reminders, and keeps task status updated for the leadership team." },
  ],
  tools: [
    { name: "draft_email_response", params: "email_summary, tone, include_action_items", description: "Generate context-aware email responses with optional action item extraction" },
    { name: "create_agenda", params: "meeting_type, attendees, topics, duration_minutes", description: "Build structured meeting agendas with time allocations and prep materials" },
    { name: "summarize_actions", params: "conversation_text, assign_owners", description: "Extract action items from any conversation and assign responsible owners" },
  ],
  scenarios: [
    { title: "Prep for a quarterly board meeting", description: "The Executive Assistant creates a detailed agenda, pulls relevant financials and program reports, drafts briefing notes for each board member, and prepares a post-meeting action item tracker." },
    { title: "Triage a week of executive emails", description: "Categorizes 47 emails into urgent, action-needed, FYI, and delegate buckets. Drafts responses for 12 routine items and flags 3 requiring the ED's personal attention." },
    { title: "Coordinate a multi-stakeholder planning session", description: "Finds an optimal 2-hour slot across 8 calendars, sends calendar invites with pre-read materials, creates a facilitation agenda, and sets up a shared notes document." },
  ],
};

/* ── Page Component ──────────────────────────────────────────── */
export default function ExecutiveAssistantPage() {
  return (
    <div className="spial-page">
      <SpialNavbar />

      {/* Hero */}
      <section className="bg-[#1a2b32] py-20 md:py-24 relative overflow-hidden">
        <div className="spial-container relative z-[1]">
          <div className="flex flex-col items-center text-center">
            <ClipboardList className="w-16 h-16 text-[#d2b4fe] mb-6" />
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
            <Placeholder className="w-full aspect-[4/3]" label="Executive Assistant" />
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
