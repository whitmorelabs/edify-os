"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Star,
  TrendingUp,
  Users,
  Clock,
  Landmark,
  Megaphone,
  CalendarCheck,
  BookOpen,
  Heart,
  PartyPopper,
} from "lucide-react";
import SpialNavbar from "@/components/spial-navbar";
import SpialFooter from "@/components/spial-footer";
import SectionLabel from "@/components/section-label";
import Placeholder from "@/components/placeholder";

/* ── Hero ─────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="bg-[#1a2b32] py-20 relative overflow-hidden">
      <div className="spial-container mx-auto relative z-[1]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Text */}
          <div className="mb-10 md:mb-0">
            <h1 className="text-white text-[36px] md:text-[52px] font-semibold leading-[1.2] mb-5">
              Your nonprofit just hired an AI leadership team.
            </h1>
            <p className="text-white/80 text-lg mb-[30px] leading-[1.7]">
              Team members wearing too many hats. Grant funding that won&apos;t cover operations. You can&apos;t hire your way out. But you can build your way forward.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/signup" className="spial-btn no-underline">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/demo"
                className="px-6 py-3 rounded-full border border-white/30 text-white text-sm font-medium no-underline transition-colors duration-300 hover:bg-white/10 flex items-center gap-2"
              >
                See the Demo
              </Link>
            </div>
            <div className="flex gap-2.5 mt-[30px]">
              <div className="w-12 h-12 rounded-full bg-[#e5e5e5] border-2 border-[#8B5CF6]" />
              <div className="w-12 h-12 rounded-full bg-[#e5e5e5] border-2 border-[#8B5CF6]" />
              <div className="w-12 h-12 rounded-full bg-[#e5e5e5] border-2 border-[#8B5CF6]" />
              <p className="text-white/60 text-sm self-center ml-2">Trusted by nonprofits across the Southeast</p>
            </div>
          </div>

          {/* Visuals */}
          <div className="relative">
            <Placeholder
              className="w-full aspect-[4/3]"
              label="Dashboard Preview"
              src="https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=800"
            />
            <div className="absolute bottom-5 left-5 bg-white/10 backdrop-blur-[10px] rounded-lg p-5 text-white text-sm max-w-[280px]">
              <strong className="block mb-1">Development Director</strong>
              Found 3 grant opportunities matching your mission. Deadline in 9 days -- want me to start the LOI?
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Meet Your Team Section ───────────────────────────────────── */
const teamMembers = [
  {
    icon: Landmark,
    name: "Development Director",
    slug: "development-director",
    role: "Finds grants. Cultivates donors. Keeps the money coming in.",
    accent: "text-emerald-400",
    border: "border-emerald-500/30",
    capabilities: [
      "Research and rank grant opportunities",
      "Draft proposals, LOIs, and thank-you letters",
      "Manage donor relationships and giving history",
    ],
  },
  {
    icon: Megaphone,
    name: "Marketing Director",
    slug: "marketing-director",
    role: "Tells your story with the right angle, for the right audience.",
    accent: "text-amber-400",
    border: "border-amber-500/30",
    capabilities: [
      "Create social media content and campaigns",
      "Write newsletters, press releases, and blog posts",
      "Analyze engagement and optimize messaging",
    ],
  },
  {
    icon: CalendarCheck,
    name: "Executive Assistant",
    slug: "executive-assistant",
    role: "Runs the calendar, triages the inbox, and keeps the trains on track.",
    accent: "text-sky-400",
    border: "border-sky-500/30",
    capabilities: [
      "Draft and triage emails",
      "Prepare meeting agendas and board materials",
      "Track action items and deadlines",
    ],
  },
  {
    icon: BookOpen,
    name: "Programs Director",
    slug: "programs-director",
    role: "Designs programs that work and proves they do.",
    accent: "text-violet-400",
    border: "border-violet-500/30",
    capabilities: [
      "Build logic models and theories of change",
      "Track outcomes and generate funder reports",
      "Monitor compliance and reporting deadlines",
    ],
  },
  {
    icon: Heart,
    name: "HR & Volunteer Coordinator",
    slug: "hr-volunteer-coordinator",
    role: "Builds the team culture and keeps volunteers engaged.",
    accent: "text-pink-400",
    border: "border-pink-500/30",
    capabilities: [
      "Recruit, onboard, and retain volunteers",
      "Write job descriptions and HR policies",
      "Design training and orientation programs",
    ],
  },
  {
    icon: PartyPopper,
    name: "Events Director",
    slug: "events-director",
    role: "Plans every detail so your events feel effortless.",
    accent: "text-orange-400",
    border: "border-orange-500/30",
    capabilities: [
      "Build reverse timelines and run-of-show documents",
      "Manage vendors, sponsors, and logistics",
      "Track event ROI and post-event follow-up",
    ],
  },
];

function MeetYourTeam() {
  return (
    <section className="py-20 bg-[#f7f6f5]" id="team">
      <div className="spial-container mx-auto">
        <SectionLabel text="Your AI Team" />
        <h2 className="text-[28px] md:text-[34px] font-medium text-black mb-4 text-center">
          Six directors. Every operational role covered.
        </h2>
        <p className="text-center text-[#666] leading-[1.7] max-w-[600px] mx-auto mb-[50px]">
          Each team member has a distinct personality, a specific expertise, and a team of specialized subagents doing the legwork. This isn&apos;t a chatbot. It&apos;s a leadership team.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.map((m) => (
            <Link
              key={m.slug}
              href={`/agents/${m.slug}`}
              className={`bg-white rounded-xl p-7 shadow-[0_2px_8px_rgba(0,0,0,0.05)] border ${m.border} no-underline transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(0,0,0,0.1)] block`}
            >
              <div className="flex items-center gap-3 mb-3">
                <m.icon className={`w-6 h-6 ${m.accent}`} />
                <h3 className={`text-lg font-semibold ${m.accent}`}>{m.name}</h3>
              </div>
              <p className="text-[#555] text-sm leading-[1.6] mb-4">{m.role}</p>
              <ul className="list-none">
                {m.capabilities.map((c, i) => (
                  <li key={i} className="text-sm text-[#666] mb-2 flex gap-2 before:content-['→'] before:text-[#8B5CF6] before:shrink-0">
                    {c}
                  </li>
                ))}
              </ul>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── How It Works ─────────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Brief us on your mission",
      desc: "Upload your org docs, describe your programs, and share your brand voice. Your team learns your context so every response fits your organization.",
    },
    {
      number: "02",
      title: "Your team gets to work",
      desc: "Ask a question, assign a task, or let the team surface opportunities proactively. Grants, campaigns, reports, schedules -- they handle the execution.",
    },
    {
      number: "03",
      title: "Review, approve, lead",
      desc: "You stay in control. Review every recommendation, approve what moves forward, and focus on the work only you can do.",
    },
  ];

  return (
    <section className="py-20 bg-[#f7f6f5]">
      <div className="spial-container mx-auto">
        <SectionLabel text="How It Works" />
        <h2 className="text-[28px] md:text-[34px] font-medium text-black mb-4 text-center">
          Up and running in minutes.
        </h2>
        <p className="text-center text-[#666] leading-[1.7] max-w-[560px] mx-auto mb-[50px]">
          No complex onboarding. No IT department. Brief your team, and they start working.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
          {steps.map((s) => (
            <div key={s.number} className="bg-white p-8 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] text-center">
              <div className="text-[56px] font-bold text-[#8B5CF6]/30 leading-none mb-4">{s.number}</div>
              <h3 className="text-xl font-semibold text-black mb-3">{s.title}</h3>
              <p className="text-[#666] text-sm leading-[1.7]">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Stats Section ────────────────────────────────────────────── */
function StatsSection() {
  const stats = [
    {
      icon: <Users className="w-12 h-12 text-[#8B5CF6]" />,
      value: "6",
      label: "AI Directors on your team",
    },
    {
      icon: <TrendingUp className="w-12 h-12 text-[#8B5CF6]" />,
      value: "31",
      label: "Specialized subagents",
    },
    {
      icon: <Clock className="w-12 h-12 text-[#8B5CF6]" />,
      value: "24/7",
      label: "Always-on coverage",
    },
    {
      icon: <Star className="w-12 h-12 text-[#8B5CF6]" />,
      value: "BYOK",
      label: "Bring your own API key",
    },
  ];

  return (
    <section className="py-20 bg-[#f7f6f5]">
      <div className="spial-container mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mt-10 text-center">
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="mb-4">{s.icon}</div>
              <div className="text-[48px] font-bold text-[#8B5CF6] mb-2.5">
                {s.value}
              </div>
              <div className="text-sm text-[#666]">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Features Deep Dive ───────────────────────────────────────── */
function FeaturesDeepDive() {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      label: "Grant Research",
      title: "Never miss a grant deadline again",
      points: [
        "Search and rank grant opportunities by mission fit, dollar amount, and deadline proximity",
        "Draft full proposals, LOIs, budget narratives, and supporting documents from your org context",
        "Track application status and get reminders before deadlines slip",
      ],
    },
    {
      label: "Donor Management",
      title: "Relationships that actually get managed",
      points: [
        "Pull any donor's giving history, engagement timeline, and communication log instantly",
        "Draft personalized outreach: thank-you letters, re-engagement emails, major gift asks",
        "Segment your list and get proactive alerts for donors going cold",
      ],
    },
    {
      label: "Marketing",
      title: "Content that sounds like you",
      points: [
        "Platform-native social posts for LinkedIn, Instagram, Facebook, and more",
        "Newsletters, press releases, and campaign copy written in your brand voice",
        "Campaign performance analysis with specific optimization recommendations",
      ],
    },
    {
      label: "Programs",
      title: "Design programs. Prove they work.",
      points: [
        "Build logic models and theories of change from scratch or update existing ones",
        "Track outcomes, generate funder reports, and monitor compliance deadlines",
        "Design surveys, needs assessments, and data collection instruments",
      ],
    },
    {
      label: "Volunteers",
      title: "A volunteer program that feels professional",
      points: [
        "Write clear role descriptions and build onboarding checklists that stick",
        "Track hours, certifications, and engagement -- flag gaps before events",
        "Draft HR policies, performance frameworks, and training curricula",
      ],
    },
    {
      label: "Events",
      title: "Every detail locked before event day",
      points: [
        "Reverse-engineered planning timelines from event date to today",
        "Run-of-show documents, vendor tracking, and sponsorship management",
        "Post-event ROI analysis and debrief reports for next year's team",
      ],
    },
  ];

  return (
    <section className="py-20 bg-[#392e3b] text-white">
      <div className="spial-container mx-auto">
        <h2 className="text-[28px] md:text-[34px] font-medium text-white mb-10 text-center">
          One platform. Six roles. Everything covered.
        </h2>

        {/* Tab buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 mb-10 flex-wrap">
          {tabs.map((t, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`px-6 py-3 rounded-lg text-sm cursor-pointer transition-all duration-300 border-2 font-[inherit] ${
                activeTab === i
                  ? "bg-[#8B5CF6] text-black border-[#8B5CF6]"
                  : "bg-transparent text-white border-white/20 hover:border-[#8B5CF6]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h3 className="text-[26px] font-normal text-white mb-5">
              {tabs[activeTab].title}
            </h3>
            <ul className="list-none text-white/80">
              {tabs[activeTab].points.map((p, i) => (
                <li
                  key={i}
                  className="mb-4 flex gap-2.5 before:content-['•'] before:text-[#8B5CF6] before:font-bold"
                >
                  {p}
                </li>
              ))}
            </ul>
            <Link
              href="/features"
              className="text-[#8B5CF6] no-underline font-medium inline-flex items-center gap-2 mt-5 transition-colors duration-300 hover:text-[#7C3AED]"
            >
              See all features
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <Placeholder
            className="w-full aspect-[4/3]"
            label={`${tabs[activeTab].label} Preview`}
          />
        </div>
      </div>
    </section>
  );
}

/* ── Decision Lab Callout ─────────────────────────────────────── */
function DecisionLabCallout() {
  return (
    <section className="py-20 bg-[#f7f6f5]">
      <div className="spial-container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[60px] items-center">
          <Placeholder
            className="w-full aspect-[4/3]"
            label="Decision Lab Preview"
          />
          <div>
            <SectionLabel text="Decision Lab" align="left" />
            <h2 className="text-[28px] md:text-[34px] font-medium text-black mb-5">
              Run it by the team.
            </h2>
            <p className="leading-[1.7] text-[#333] mb-4">
              Every major decision deserves more than one perspective. Type in a scenario -- "Should we cancel our gala?" or "Review this donor email before I send it" -- and get six expert takes in seconds.
            </p>
            <p className="leading-[1.7] text-[#333] mb-4">
              Marketing rates the messaging. Programs checks mission alignment. Development weighs the fundraising angle. Your Executive Assistant summarizes what the team agrees on, where they disagree, and what to do next.
            </p>
            <p className="leading-[1.7] text-[#666] text-sm">
              Like a leadership retreat in 30 seconds. Without the catering bill.
            </p>
            <ul className="list-none mt-[30px]">
              {[
                "6 perspectives in parallel, not sequentially",
                "Each director responds in their own voice and expertise",
                "Synthesis summary with consensus, risks, and next steps",
              ].map((f, i) => (
                <li
                  key={i}
                  className="flex gap-4 mb-4 text-base before:content-['\2713'] before:text-[#8B5CF6] before:font-bold before:text-lg before:shrink-0"
                >
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Heartbeats Callout ───────────────────────────────────────── */
function HeartbeatsCallout() {
  return (
    <section className="py-20 bg-[#f7f6f5]">
      <div className="spial-container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[60px] items-center">
          <div>
            <SectionLabel text="Proactive Heartbeats" align="left" />
            <h2 className="text-[28px] md:text-[34px] font-medium text-black mb-5">
              Your team checks in on their own.
            </h2>
            <p className="leading-[1.7] text-[#333] mb-4">
              The difference between a tool and a teammate is that a teammate doesn&apos;t wait to be asked. Your AI directors scan their domains every few hours and bring you what matters.
            </p>
            <p className="leading-[1.7] text-[#333] mb-4">
              Grant deadline in 9 days? Your Development Director flags it. Campaign engagement dropped this week? Marketing tells you why and what to try. Board meeting tomorrow? Your Executive Assistant has the briefing ready.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-[30px]">
              {[
                { title: "Flags risks early", desc: "Before deadlines slip or donors go cold" },
                { title: "Celebrates wins", desc: "Surfaces milestones you might have missed" },
                { title: "Suggests next steps", desc: "Always comes with a clear action, not just data" },
                { title: "Quiet when nothing is new", desc: "Only checks in when there is something worth saying" },
              ].map((b, i) => (
                <div key={i} className="bg-white p-[30px] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                  <h3 className="text-base font-semibold mb-2">{b.title}</h3>
                  <p className="text-sm text-[#666]">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <Placeholder
            className="w-full aspect-[4/3]"
            label="Heartbeat Inbox Preview"
          />
        </div>
      </div>
    </section>
  );
}

/* ── Testimonials Section ─────────────────────────────────────── */
function TestimonialsSection() {
  const reviews = [
    {
      name: "Marcus T.",
      org: "Community Food Network, Executive Director",
      text: "We were spending 15 hours a week on grant writing. Now the Development Director drafts the first pass overnight and I spend an hour reviewing. That is time I actually get to spend in our programs.",
    },
    {
      name: "Priya M.",
      org: "Youth Arts Initiative, Development Manager",
      text: "The Decision Lab changed how our leadership team operates. We tested a major program expansion through it and the Programs Director caught a compliance risk we hadn't even thought about.",
    },
    {
      name: "Linda K.",
      org: "Senior Services Coalition, Executive Director",
      text: "I was doing the work of four people. Edify OS didn't replace me -- it filled the roles I couldn't fill. Having an Events Director and HR Coordinator I can actually talk to is something I didn't think was possible at our budget.",
    },
    {
      name: "James R.",
      org: "Coastal Conservation Alliance, Programs Director",
      text: "The outcome reports used to take me two full days per grant. The Programs Director gets them done in 20 minutes. The data is right, the narrative is in our voice, and funders have noticed the quality.",
    },
    {
      name: "Sofia D.",
      org: "Education Equity Fund, Executive Director",
      text: "What sold me was the heartbeats. I stopped worrying about what I was missing because the team tells me every morning. That peace of mind is worth everything.",
    },
    {
      name: "Terrence A.",
      org: "Housing First Network, Development Director",
      text: "We raised 40% more in our annual campaign this year. I can not attribute all of that to Edify OS, but the Marketing Director's campaign strategy and the donor outreach it handled were a huge part of it.",
    },
  ];

  return (
    <section className="py-20 bg-[#f7f6f5]">
      <div className="spial-container mx-auto">
        <SectionLabel text="What Leaders Say" />
        <div className="text-center mb-[50px]">
          <h2 className="text-[28px] md:text-[34px] font-medium text-black mb-4">
            From nonprofit leaders who know the struggle.
          </h2>
          <p className="leading-[1.7] text-[#333]">
            These are the real conversations happening when a team shows up to do the work.
          </p>
        </div>

        <div className="mt-[50px]">
          <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-[30px]">
            {reviews.map((r, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-[30px] shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
              >
                <div className="flex gap-4 mb-5">
                  <div className="w-14 h-14 rounded-full bg-[#e5e5e5] shrink-0" />
                  <div className="flex-1">
                    <div className="font-semibold mb-1">{r.name}</div>
                    <div className="text-sm text-[#999]">{r.org}</div>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className="w-4 h-4 fill-[#f5a623] text-[#f5a623]"
                    />
                  ))}
                </div>
                <div className="text-[15px] text-[#666] leading-[1.6]">
                  {r.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Blog Section ─────────────────────────────────────────────── */
function BlogSection() {
  const blogs = [
    {
      category: "AI for Nonprofits",
      title: "Why AI Won't Replace Your Team. It'll Complete It.",
      date: "Apr 8, 2026",
      href: "/blog/ai-wont-replace-your-team",
      image: "https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=600",
    },
    {
      category: "Fundraising",
      title: "The Grant Research Problem Nobody Talks About",
      date: "Apr 1, 2026",
      href: "/blog/grant-research-problem",
      image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600",
    },
    {
      category: "Leadership",
      title: "From Drowning in Admin to Leading with Vision",
      date: "Mar 24, 2026",
      href: "/blog/from-drowning-to-leading",
      image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600",
    },
  ];

  return (
    <section className="py-20 bg-[#f7f6f5]" id="blogs">
      <div className="spial-container mx-auto text-center">
        <SectionLabel text="From the Blog" />
        <h2 className="text-[28px] md:text-[34px] font-medium text-black mb-5">
          For the people doing the work.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[30px] mt-[50px]">
          {blogs.map((b, i) => (
            <a
              key={i}
              href={b.href}
              className="bg-white rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_8px_16px_rgba(0,0,0,0.1)] no-underline block"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.image} alt={b.title} className="w-full h-[220px] object-cover" />
              <div className="p-[25px]">
                <div className="text-xs text-[#8B5CF6] font-semibold uppercase mb-2.5">
                  {b.category}
                </div>
                <h3 className="text-xl font-semibold text-black mb-2.5">
                  {b.title}
                </h3>
                <div className="text-[13px] text-[#999]">{b.date}</div>
              </div>
            </a>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href="/blog" className="text-[#8B5CF6] no-underline font-medium inline-flex items-center gap-2 transition-colors duration-300 hover:text-[#7C3AED]">
            Read all articles
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── FAQ Section ──────────────────────────────────────────────── */
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "What is Edify OS?",
      a: "Edify OS is a platform that gives nonprofits access to six AI-powered directors: Development, Marketing, Executive Assistant, Programs, HR/Volunteer, and Events. Each one has a distinct personality, deep expertise in their domain, and a team of specialized subagents. You brief them on your organization and they get to work.",
    },
    {
      q: "Who is this for?",
      a: "Any nonprofit that is resource-constrained and operationally stretched. If your team is wearing too many hats, missing grant deadlines, or struggling to keep communications consistent -- Edify OS fills the gaps. It is especially powerful for small to mid-size organizations that cannot afford to hire all the specialists they need.",
    },
    {
      q: "How do the AI team members actually work?",
      a: "Each director has a system prompt that defines their expertise, personality, and decision-making style. When you ask them something, they respond in their own voice with recommendations grounded in your organization's context. They can also delegate to specialized subagents for deeper work -- the Development Director delegates to a Grant Research agent, for example.",
    },
    {
      q: "What is BYOK and why does it matter?",
      a: "BYOK stands for Bring Your Own Key. You connect your own Claude API key from Anthropic, and all AI calls run directly through your account. This means you only pay for what you use (typically a few cents per conversation), we never see your API key after initial setup, and your data stays in your pipeline. No markup, no black box.",
    },
    {
      q: "Is my organization's data secure?",
      a: "Your org data stays in your system. The org briefing you complete during onboarding is stored in your session and injected into prompts as context -- it does not get shared across organizations or used to train models. We recommend reviewing Anthropic's data policies for details on how API calls are handled on their end.",
    },
    {
      q: "Can I customize how the team works?",
      a: "Yes. During onboarding you brief the team on your org's mission, programs, brand voice, and goals. That context shapes every response. You can also configure each director's proactive heartbeat schedule -- how often they check in, what they scan for, and when they stay quiet.",
    },
  ];

  const toggleAccordion = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-20 bg-[#f7f6f5]">
      <div className="spial-container mx-auto text-center">
        <h2 className="text-[28px] md:text-[34px] font-medium text-black mb-[50px]">
          Frequently Asked Questions
        </h2>
        <div className="max-w-[700px] mx-auto mt-[50px] text-left">
          {faqs.map((f, i) => (
            <div key={i} className="border-b border-[#ddd] mb-5">
              <div
                className="flex justify-between items-center py-5 cursor-pointer font-medium text-lg select-none hover:text-[#8B5CF6] transition-colors duration-300"
                onClick={() => toggleAccordion(i)}
              >
                <span>{f.q}</span>
                <span
                  className={`text-2xl text-[#8B5CF6] transition-transform duration-300 ${
                    openIndex === i ? "rotate-45" : ""
                  }`}
                >
                  +
                </span>
              </div>
              <div
                className={`overflow-hidden transition-all duration-300 text-[#666] leading-[1.6] ${
                  openIndex === i
                    ? "max-h-[500px] pb-5"
                    : "max-h-0 pb-0"
                }`}
              >
                <p>{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA Section ──────────────────────────────────────────────── */
function CTASection() {
  return (
    <section className="pt-[10px] pb-[100px] bg-[#f7f6f5]">
      <div className="spial-container mx-auto flex flex-col items-center text-center">
        <h2 className="text-[28px] md:text-[42px] font-medium text-black max-w-[600px] leading-[1.3]">
          Stop drowning in execution. Start leading.
        </h2>
        <p className="text-[#666] leading-[1.7] mt-5 max-w-[500px]">
          Your team is ready. Brief them on your mission and watch what happens when six directors show up for you.
        </p>
        <div style={{ height: "50px" }} />
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/signup" className="spial-btn no-underline">
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/demo"
            className="px-6 py-3 rounded-full border border-[#333] text-[#333] text-sm font-medium no-underline transition-colors duration-300 hover:bg-[#333] hover:text-white"
          >
            See the Demo
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Page ──────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="spial-page">
      <SpialNavbar />
      <Hero />
      <MeetYourTeam />
      <HowItWorks />
      <StatsSection />
      <FeaturesDeepDive />
      <DecisionLabCallout />
      <HeartbeatsCallout />
      <TestimonialsSection />
      <BlogSection />
      <FAQSection />
      <CTASection />
      <SpialFooter />
    </div>
  );
}
