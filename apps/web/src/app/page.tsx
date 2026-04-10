"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  CheckCircle,
  Shield,
  Zap,
  BarChart3,
  Landmark,
  Megaphone,
  CalendarCheck,
  Quote,
  ChevronRight,
  ChevronDown,
  Star,
  Users,
  Target,
  Clock,
  Menu,
  X,
  Mail,
} from "lucide-react";

/* -- Agent data ----------------------------------------------------------- */
const agents = [
  {
    icon: Landmark,
    name: "Director of Development",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    description:
      "Your tireless fundraiser. Researches grants, writes proposals, manages donor pipelines, and keeps your CRM updated.",
    capabilities: [
      "Grant research & writing",
      "Donor outreach emails",
      "Fundraising pipeline tracking",
      "CRM management",
    ],
  },
  {
    icon: Megaphone,
    name: "Marketing Director",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    description:
      "Amplifies your mission. Runs social campaigns, writes newsletters, plans content calendars, and tracks engagement.",
    capabilities: [
      "Social media campaigns",
      "Newsletter creation",
      "Content strategy",
      "Engagement analytics",
    ],
  },
  {
    icon: CalendarCheck,
    name: "Executive Assistant",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    description:
      "Your operations backbone. Triages email, preps meetings, manages schedules, and coordinates across your team.",
    capabilities: [
      "Email triage & drafting",
      "Meeting preparation",
      "Schedule management",
      "Task coordination",
    ],
  },
];

/* -- Stats ---------------------------------------------------------------- */
const stats = [
  { value: "10x", label: "Capacity multiplier", icon: Zap },
  { value: "24/7", label: "Always working", icon: Clock },
  { value: "95%", label: "Approval rate", icon: Target },
  { value: "500+", label: "Nonprofits served", icon: Users },
];

/* -- Testimonials --------------------------------------------------------- */
const testimonials = [
  {
    quote:
      "Edify OS replaced three part-time roles for us. Our grant pipeline has never been stronger — the AI found opportunities we didn't even know existed.",
    name: "Sarah Chen",
    title: "Executive Director, Hope Community Foundation",
    stars: 5,
  },
  {
    quote:
      "The marketing director agent wrote our entire spring campaign in one afternoon. Social engagement is up 340% since we started.",
    name: "Marcus Williams",
    title: "Board Chair, Urban Youth Alliance",
    stars: 5,
  },
  {
    quote:
      "I finally have time to lead instead of drowning in admin. The executive assistant handles my inbox and meeting prep perfectly.",
    name: "Priya Patel",
    title: "CEO, Green Futures Collective",
    stars: 5,
  },
];

/* -- Value props for alternating sections --------------------------------- */
const valueProps = [
  {
    icon: Shield,
    tag: "Privacy First",
    title: "Your data, your control",
    desc: "Bring your own API key. Your data is encrypted at rest and never used for training. Full privacy by design. We never see your donors, your emails, or your strategy.",
    bullets: [
      "BYOK encryption model",
      "SOC 2 compliant infrastructure",
      "Zero data retention policy",
    ],
  },
  {
    icon: Zap,
    tag: "Proactive Intelligence",
    title: "Opportunities found before you ask",
    desc: "The heartbeat system monitors grants, emails, and social media around the clock. It surfaces relevant opportunities, flags deadlines, and drafts responses before they hit your radar.",
    bullets: [
      "Automated grant discovery",
      "Deadline tracking & alerts",
      "Smart email triage",
    ],
  },
  {
    icon: BarChart3,
    tag: "Built-in Trust",
    title: "Confidence scoring on every output",
    desc: "Every output includes a confidence score. High confidence items auto-execute. Low confidence items ask for your input. You stay in control while scaling your throughput.",
    bullets: [
      "Adjustable autonomy levels",
      "Approval queue dashboard",
      "Audit trail for every action",
    ],
  },
];

/* -- FAQ ------------------------------------------------------------------ */
const faqs = [
  {
    q: "Is this really built for nonprofits?",
    a: "Yes. Every agent, workflow, and template in Edify OS is purpose-built for the nonprofit sector. From grant writing to donor management to impact reporting, we understand the unique challenges nonprofits face.",
  },
  {
    q: "How does pricing work for small organizations?",
    a: "We offer a free tier for organizations with budgets under $500K. Paid plans scale with your needs. We believe every nonprofit deserves access to AI-powered operations, regardless of budget.",
  },
  {
    q: "What happens to our data?",
    a: "Your data is encrypted at rest and in transit. We use a Bring Your Own Key (BYOK) model, meaning we never have access to your unencrypted data. Nothing is used for model training. Period.",
  },
  {
    q: "Can we integrate with our existing tools?",
    a: "Edify OS integrates with popular nonprofit tools including Salesforce NPSP, Bloomerang, Mailchimp, Google Workspace, Slack, and more. Our API also supports custom integrations.",
  },
  {
    q: "How much technical expertise do we need?",
    a: "None. Edify OS is designed for nonprofit leaders, not engineers. Setup takes under 5 minutes, and our AI agents learn your organization's context through a simple onboarding conversation.",
  },
  {
    q: "What if an AI agent makes a mistake?",
    a: "Every action goes through your approval queue until you increase autonomy. You can review, edit, or reject any output. The confidence scoring system ensures high-stakes decisions always get human review.",
  },
];

/* ========================================================================= */
export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-dark text-white overflow-hidden">
      {/* ----------------------------------------------------------------- */}
      {/* Fixed Navigation                                                  */}
      {/* ----------------------------------------------------------------- */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-dark/70 backdrop-blur-xl">
        <div className="section-container flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Edify OS</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#agents"
              className="text-sm text-white/50 hover:text-brand-400 transition-colors"
            >
              AI Team
            </a>
            <a
              href="#features"
              className="text-sm text-white/50 hover:text-brand-400 transition-colors"
            >
              Features
            </a>
            <a
              href="#testimonials"
              className="text-sm text-white/50 hover:text-brand-400 transition-colors"
            >
              Testimonials
            </a>
            <a
              href="#faq"
              className="text-sm text-white/50 hover:text-brand-400 transition-colors"
            >
              FAQ
            </a>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-white/50 hover:text-white transition-colors font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-white/60 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-dark/95 backdrop-blur-xl">
            <div className="section-container py-4 flex flex-col gap-3">
              <a
                href="#agents"
                className="text-sm text-white/60 hover:text-white py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                AI Team
              </a>
              <a
                href="#features"
                className="text-sm text-white/60 hover:text-white py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#testimonials"
                className="text-sm text-white/60 hover:text-white py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Testimonials
              </a>
              <a
                href="#faq"
                className="text-sm text-white/60 hover:text-white py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQ
              </a>
              <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                <Link
                  href="/login"
                  className="text-sm text-white/60 hover:text-white"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ----------------------------------------------------------------- */}
      {/* Hero Section                                                      */}
      {/* ----------------------------------------------------------------- */}
      <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-32 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[700px] glow-cyan-intense pointer-events-none" />

        <div className="section-container relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 border border-brand-500/20 px-4 py-2 text-sm font-medium text-brand-400 mb-8">
              <Sparkles className="h-4 w-4" />
              AI-Powered Teams for Nonprofits
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.08]">
              Your nonprofit just
              <br className="hidden sm:block" />
              hired its{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-cyan-300">
                smartest team
              </span>
            </h1>

            {/* Subhead */}
            <p className="mt-6 text-lg sm:text-xl text-white/45 leading-relaxed max-w-2xl mx-auto">
              Edify OS gives your organization a full AI leadership team — a
              Director of Development, Marketing Director, and Executive
              Assistant — working around the clock so you can focus on mission.
            </p>

            {/* CTA buttons */}
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-8 py-3.5 text-base font-semibold text-white hover:bg-brand-600 hover:shadow-lg hover:shadow-brand-500/25 transition-all duration-200"
              >
                Start Free
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#agents"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-200"
              >
                Meet Your Team
              </a>
            </div>

            {/* Social proof strip */}
            <div className="mt-16 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-white/25">
              <span className="flex items-center gap-1.5">
                <Shield className="h-4 w-4" /> SOC 2 Compliant
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4" /> BYOK Encryption
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" /> 500+ Nonprofits
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Stats Strip                                                       */}
      {/* ----------------------------------------------------------------- */}
      <section className="border-y border-white/5">
        <div className="section-container py-16 lg:py-20">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 mb-4">
                  <s.icon className="h-6 w-6 text-brand-400" />
                </div>
                <p className="text-3xl sm:text-4xl font-extrabold text-white">
                  {s.value}
                </p>
                <p className="mt-1 text-sm text-white/35">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* AI Agent Cards                                                    */}
      {/* ----------------------------------------------------------------- */}
      <section id="agents" className="section-padding relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] glow-cyan pointer-events-none" />

        <div className="section-container relative">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-brand-400 uppercase tracking-wider mb-3">
              Your AI Team
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              Three leaders. Twelve subagents.
              <br className="hidden sm:block" /> One unstoppable team.
            </h2>
            <p className="mt-4 text-white/40 max-w-xl mx-auto">
              Each agent specializes in a critical area of nonprofit operations,
              backed by subagents that handle specific tasks.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {agents.map((a) => (
              <div
                key={a.name}
                className={`rounded-2xl border ${a.border} bg-dark-card p-8 hover:border-opacity-60 hover:shadow-lg hover:shadow-brand-500/5 transition-all duration-300`}
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl ${a.bg} mb-6`}
                >
                  <a.icon className={`h-7 w-7 ${a.color}`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{a.name}</h3>
                <p className="text-sm text-white/40 leading-relaxed mb-5">
                  {a.description}
                </p>
                <ul className="space-y-2.5">
                  {a.capabilities.map((cap) => (
                    <li
                      key={cap}
                      className="flex items-center gap-2.5 text-sm text-white/55"
                    >
                      <CheckCircle
                        className={`h-4 w-4 shrink-0 ${a.color}`}
                      />
                      {cap}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`mt-6 inline-flex items-center gap-1.5 text-sm font-semibold ${a.color} hover:underline`}
                >
                  Hire this agent
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Alternating Feature Sections                                      */}
      {/* ----------------------------------------------------------------- */}
      <section id="features" className="section-padding border-t border-white/5">
        <div className="section-container">
          <div className="text-center mb-20">
            <p className="text-sm font-semibold text-brand-400 uppercase tracking-wider mb-3">
              Why Edify OS
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              Built for nonprofits that need
              <br className="hidden sm:block" /> to do more with less
            </h2>
          </div>

          <div className="space-y-24 lg:space-y-32">
            {valueProps.map((vp, i) => (
              <div
                key={vp.title}
                className={`flex flex-col gap-12 lg:gap-16 lg:flex-row lg:items-center ${
                  i % 2 !== 0 ? "lg:flex-row-reverse" : ""
                }`}
              >
                {/* Visual side */}
                <div className="flex-1">
                  <div className="relative rounded-2xl border border-white/10 bg-dark-card p-8 sm:p-12">
                    <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10 mb-6">
                      <vp.icon className="h-8 w-8 text-brand-400" />
                    </div>
                    <div className="space-y-4">
                      {vp.bullets.map((b) => (
                        <div
                          key={b}
                          className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/5 px-4 py-3"
                        >
                          <CheckCircle className="h-5 w-5 text-brand-400 shrink-0" />
                          <span className="text-sm text-white/60">{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Text side */}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-brand-400 uppercase tracking-wider mb-3">
                    {vp.tag}
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4">
                    {vp.title}
                  </h3>
                  <p className="text-white/45 leading-relaxed text-lg">
                    {vp.desc}
                  </p>
                  <Link
                    href="/signup"
                    className="mt-6 inline-flex items-center gap-2 text-brand-400 font-semibold hover:text-brand-300 transition-colors"
                  >
                    Learn more
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Testimonials                                                      */}
      {/* ----------------------------------------------------------------- */}
      <section
        id="testimonials"
        className="section-padding border-t border-white/5"
      >
        <div className="section-container">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-brand-400 uppercase tracking-wider mb-3">
              Testimonials
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              Loved by nonprofit leaders
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border border-white/10 bg-dark-card p-8 hover:border-white/20 transition-colors duration-300"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-brand-400 text-brand-400"
                    />
                  ))}
                </div>
                <Quote className="h-8 w-8 text-brand-500/40 mb-3" />
                <p className="text-white/55 leading-relaxed mb-6">{t.quote}</p>
                <div>
                  <p className="font-bold text-white">{t.name}</p>
                  <p className="text-sm text-white/35">{t.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* FAQ Section                                                       */}
      {/* ----------------------------------------------------------------- */}
      <section id="faq" className="section-padding border-t border-white/5">
        <div className="section-container">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-brand-400 uppercase tracking-wider mb-3">
              FAQ
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Frequently asked questions
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-dark-card overflow-hidden transition-colors hover:border-white/15"
              >
                <button
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <span className="font-semibold text-white">{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-white/40 transition-transform duration-200 ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 -mt-1">
                    <p className="text-white/50 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* CTA Footer Section                                                */}
      {/* ----------------------------------------------------------------- */}
      <section className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 glow-cyan-intense pointer-events-none" />
        <div className="absolute inset-0 border-t border-white/5" />

        <div className="section-container relative text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              Ready to multiply your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-cyan-300">
                nonprofit&apos;s impact
              </span>
              ?
            </h2>
            <p className="mt-4 text-lg text-white/45 max-w-xl mx-auto">
              Stop drowning in execution. Start leading. Your AI team is ready
              to work.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-8 py-3.5 text-base font-semibold text-white hover:bg-brand-600 hover:shadow-lg hover:shadow-brand-500/25 transition-all duration-200"
              >
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-200"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Footer                                                            */}
      {/* ----------------------------------------------------------------- */}
      <footer className="border-t border-white/5 bg-[#07071a]">
        <div className="section-container py-16">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand column */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold tracking-tight">Edify OS</span>
              </div>
              <p className="text-sm text-white/30 leading-relaxed">
                AI-powered teams for nonprofits. Multiply your impact without
                multiplying your headcount.
              </p>
            </div>

            {/* Product column */}
            <div>
              <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
                Product
              </h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#agents"
                    className="text-sm text-white/30 hover:text-white/60 transition-colors"
                  >
                    AI Team
                  </a>
                </li>
                <li>
                  <a
                    href="#features"
                    className="text-sm text-white/30 hover:text-white/60 transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#testimonials"
                    className="text-sm text-white/30 hover:text-white/60 transition-colors"
                  >
                    Testimonials
                  </a>
                </li>
                <li>
                  <a
                    href="#faq"
                    className="text-sm text-white/30 hover:text-white/60 transition-colors"
                  >
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            {/* Company column */}
            <div>
              <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
                Company
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/signup"
                    className="text-sm text-white/30 hover:text-white/60 transition-colors"
                  >
                    Get Started
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="text-sm text-white/30 hover:text-white/60 transition-colors"
                  >
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>

            {/* Connect column */}
            <div>
              <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
                Connect
              </h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="mailto:hello@edifyos.com"
                    className="flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    hello@edifyos.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/20">
              &copy; 2026 Edify OS. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-white/20">
              <a
                href="#"
                className="hover:text-white/40 transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="hover:text-white/40 transition-colors"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
