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
  ImageIcon,
  Heart,
  Lightbulb,
  HandHelping,
  Camera,
} from "lucide-react";

/* ── Agent data ────────────────────────────────────────────────── */
const agents = [
  {
    icon: Landmark,
    name: "Director of Development",
    color: "text-emerald-600",
    bgIcon: "bg-emerald-50",
    borderColor: "border-emerald-100",
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
    color: "text-amber-600",
    bgIcon: "bg-amber-50",
    borderColor: "border-amber-100",
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
    color: "text-sky-600",
    bgIcon: "bg-sky-50",
    borderColor: "border-sky-100",
    description:
      "Your operations backbone. Triages email, preps meetings, manages schedules, and coordinates across your team.",
    capabilities: [
      "Email triage & drafting",
      "Meeting preparation",
      "Schedule management",
      "Task coordination",
    ],
  },
  {
    icon: BarChart3,
    name: "Program Coordinator",
    color: "text-violet-600",
    bgIcon: "bg-violet-50",
    borderColor: "border-violet-100",
    description:
      "Tracks outcomes and impact metrics. Prepares reports for funders, manages program timelines, and monitors deliverables.",
    capabilities: [
      "Impact reporting",
      "Program timeline management",
      "Funder report generation",
      "Deliverable tracking",
    ],
  },
];

/* ── Stats ─────────────────────────────────────────────────────── */
const stats = [
  { value: "10x", label: "Capacity multiplier", icon: Zap },
  { value: "24/7", label: "Always working", icon: Clock },
  { value: "$2M+", label: "Grants discovered", icon: Target },
  { value: "90%", label: "Less admin cost", icon: Users },
];

/* ── Value props for alternating sections ───────────────────────── */
const valueProps = [
  {
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

/* ── Testimonials ──────────────────────────────────────────────── */
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

/* ── FAQ ──────────────────────────────────────────────────────── */
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

/* ── Image placeholder component ──────────────────────────────── */
function ImagePlaceholder({
  label = "Image",
  className = "",
  aspect = "aspect-[4/3]",
}: {
  label?: string;
  className?: string;
  aspect?: string;
}) {
  return (
    <div
      className={`relative rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 ${aspect} flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <Camera className="h-8 w-8 text-slate-300" />
      <span className="text-sm text-slate-400 font-medium">{label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-hidden">
      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. NAVIGATION — Fixed, light/white, minimal              */}
      {/* ────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="section-container flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Edify OS
            </span>
          </Link>

          {/* Center nav links */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              How it Works
            </a>
            <a
              href="#agents"
              className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              AI Team
            </a>
            <a
              href="#testimonials"
              className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              Testimonials
            </a>
          </div>

          {/* Right side CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors shadow-sm"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-slate-500 hover:text-slate-900"
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
          <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-xl">
            <div className="section-container py-4 flex flex-col gap-3">
              <a
                href="#features"
                className="text-sm text-slate-600 hover:text-slate-900 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-sm text-slate-600 hover:text-slate-900 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                How it Works
              </a>
              <a
                href="#agents"
                className="text-sm text-slate-600 hover:text-slate-900 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                AI Team
              </a>
              <a
                href="#testimonials"
                className="text-sm text-slate-600 hover:text-slate-900 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Testimonials
              </a>
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <Link
                  href="/login"
                  className="text-sm text-slate-500 hover:text-slate-900"
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

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. HERO — Two-column: text LEFT, images RIGHT             */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-white">
        {/* Subtle decorative gradient blobs */}
        <div className="absolute top-20 right-0 w-[500px] h-[500px] rounded-full bg-brand-100/40 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-brand-50/60 blur-3xl pointer-events-none" />

        <div className="section-container relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left column — text */}
            <div>
              {/* Badge pill */}
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 border border-brand-100 px-4 py-2 text-sm font-medium text-brand-600 mb-8">
                <Sparkles className="h-4 w-4" />
                AI-Powered Teams for Nonprofits
              </div>

              {/* Big headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-slate-900">
                Your nonprofit just hired its{" "}
                <span className="text-brand-500">smartest team</span>
              </h1>

              {/* Supporting paragraph */}
              <p className="mt-6 text-lg text-slate-500 leading-relaxed max-w-lg">
                Edify OS gives your organization a full AI leadership team — a
                Director of Development, Marketing Director, and Executive
                Assistant — working around the clock so you can focus on mission.
              </p>

              {/* Stat callout */}
              <div className="mt-8 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 border border-brand-100">
                  <span className="text-2xl font-extrabold text-brand-600">
                    88%
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Less time on admin
                  </p>
                  <p className="text-sm text-slate-400">
                    Average across all nonprofits using Edify OS
                  </p>
                </div>
              </div>

              {/* Primary CTA */}
              <div className="mt-10">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-8 py-3.5 text-base font-semibold text-white hover:bg-brand-600 shadow-md shadow-brand-500/20 hover:shadow-lg hover:shadow-brand-500/30 transition-all duration-200"
                >
                  Start Free
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>

            {/* Right column — stacked image placeholders */}
            <div className="relative">
              <div className="relative z-10">
                <ImagePlaceholder
                  label="Image"
                  aspect="aspect-[4/3]"
                  className="w-full"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 w-2/3 z-20">
                <ImagePlaceholder
                  label="Image"
                  aspect="aspect-[4/3]"
                  className="w-full shadow-xl shadow-slate-200/50 bg-white"
                />
              </div>
              <div className="absolute -top-4 -right-4 w-1/2 z-0">
                <ImagePlaceholder
                  label="Image"
                  aspect="aspect-square"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 3. FEATURES — Alternating two-column                      */}
      {/* ────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 lg:py-32 bg-slate-50">
        <div className="section-container">
          {/* Section header */}
          <div className="text-center mb-20">
            <p className="text-sm font-semibold text-brand-500 uppercase tracking-wider mb-3">
              Why Edify OS
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
              Built for nonprofits that need
              <br className="hidden sm:block" /> to do more with less
            </h2>
          </div>

          {/* Alternating sections */}
          <div className="space-y-24 lg:space-y-32">
            {valueProps.map((vp, i) => (
              <div
                key={vp.title}
                className={`flex flex-col gap-12 lg:gap-20 lg:flex-row lg:items-center ${
                  i % 2 !== 0 ? "lg:flex-row-reverse" : ""
                }`}
              >
                {/* Image placeholder side */}
                <div className="flex-1">
                  <ImagePlaceholder label="Image" aspect="aspect-[4/3]" />
                </div>

                {/* Text side */}
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 border border-brand-100 px-3 py-1.5 text-xs font-semibold text-brand-600 uppercase tracking-wider mb-5">
                    {vp.tag}
                  </div>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 mb-5">
                    {vp.title}
                  </h3>
                  <p className="text-slate-500 leading-relaxed text-lg mb-8">
                    {vp.desc}
                  </p>
                  <ul className="space-y-3 mb-8">
                    {vp.bullets.map((b) => (
                      <li
                        key={b}
                        className="flex items-center gap-3 text-sm text-slate-600"
                      >
                        <CheckCircle className="h-5 w-5 text-brand-500 shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 text-brand-500 font-semibold hover:text-brand-600 transition-colors"
                  >
                    Explore more
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 4. INNOVATION / VISION — Split layout + 3 pillars         */}
      {/* ────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 lg:py-32 bg-white">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left — image */}
            <div>
              <ImagePlaceholder label="Image" aspect="aspect-[4/3]" />
            </div>

            {/* Right — text + 3 pillars */}
            <div>
              <p className="text-sm font-semibold text-brand-500 uppercase tracking-wider mb-3">
                Our Vision
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-6">
                From signup to a full AI team in under 5 minutes
              </h2>
              <p className="text-slate-500 leading-relaxed text-lg mb-10">
                Share your mission, and your AI team gets to work immediately.
                Review, approve, and scale your impact while staying in full
                control.
              </p>

              {/* Three pillars */}
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 border border-brand-100">
                    <Heart className="h-6 w-6 text-brand-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">
                      Privacy First
                    </h4>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      BYOK encryption. Your data is never used for training. Full
                      privacy by design.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 border border-brand-100">
                    <Lightbulb className="h-6 w-6 text-brand-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">
                      Proactive Intelligence
                    </h4>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Automated grant discovery, deadline alerts, and smart email
                      triage around the clock.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 border border-brand-100">
                    <HandHelping className="h-6 w-6 text-brand-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">
                      Confidence Scoring
                    </h4>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Every output gets a confidence score. High confidence
                      auto-executes, low confidence asks for input.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600 shadow-sm transition-all duration-200"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 5. STATISTICS — 4-column grid                             */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-24 bg-slate-50 border-y border-slate-100">
        <div className="section-container">
          <div className="grid grid-cols-2 gap-10 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 border border-brand-100 mb-5">
                  <s.icon className="h-6 w-6 text-brand-500" />
                </div>
                <p className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                  {s.value}
                </p>
                <p className="mt-2 text-sm text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 6. LOGO CAROUSEL — Partner logo placeholders              */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="section-container">
          <p className="text-center text-sm font-semibold text-slate-400 uppercase tracking-wider mb-10">
            Trusted by mission-driven organizations
          </p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
            {[
              "Partner Logo",
              "Partner Logo",
              "Partner Logo",
              "Partner Logo",
              "Partner Logo",
              "Partner Logo",
            ].map((label, i) => (
              <div
                key={i}
                className="flex items-center justify-center h-16 rounded-xl border border-dashed border-slate-200 bg-slate-50"
              >
                <span className="text-xs text-slate-400 font-medium">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 7. TESTIMONIALS — Card grid                               */}
      {/* ────────────────────────────────────────────────────────── */}
      <section id="testimonials" className="py-24 lg:py-32 bg-slate-50">
        <div className="section-container">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-brand-500 uppercase tracking-wider mb-3">
              Testimonials
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
              Loved by nonprofit leaders
            </h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border border-slate-200 bg-white p-8 hover:shadow-lg hover:border-brand-100 transition-all duration-300"
              >
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-brand-400 text-brand-400"
                    />
                  ))}
                </div>
                <Quote className="h-8 w-8 text-brand-200 mb-4" />
                <p className="text-slate-600 leading-relaxed mb-8">
                  {t.quote}
                </p>
                <div className="flex items-center gap-4">
                  {/* Avatar initials circle */}
                  <div className="h-11 w-11 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                    <span className="text-xs text-brand-600 font-bold">
                      {t.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{t.name}</p>
                    <p className="text-sm text-slate-400">{t.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 8. AGENT CARDS — Detailed feature cards                   */}
      {/* ────────────────────────────────────────────────────────── */}
      <section id="agents" className="py-24 lg:py-32 bg-white">
        <div className="section-container">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-brand-500 uppercase tracking-wider mb-3">
              Your AI Team
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
              Three leaders. Twelve subagents.
              <br className="hidden sm:block" /> One unstoppable team.
            </h2>
            <p className="mt-5 text-slate-500 max-w-xl mx-auto text-lg">
              Each agent specializes in a critical area of nonprofit operations,
              backed by subagents that handle specific tasks.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {agents.map((a) => (
              <div
                key={a.name}
                className={`rounded-2xl border ${a.borderColor} bg-white p-8 hover:shadow-lg hover:border-brand-200 transition-all duration-300`}
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl ${a.bgIcon} mb-6`}
                >
                  <a.icon className={`h-7 w-7 ${a.color}`} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {a.name}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-5">
                  {a.description}
                </p>
                <ul className="space-y-2.5">
                  {a.capabilities.map((cap) => (
                    <li
                      key={cap}
                      className="flex items-center gap-2.5 text-sm text-slate-600"
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
                  className={`mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors`}
                >
                  Hire this agent
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 9. BLOG / ARTICLES — Placeholder cards                    */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32 bg-slate-50">
        <div className="section-container">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-brand-500 uppercase tracking-wider mb-3">
              Resources
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Latest from Edify
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                category: "Fundraising",
                title: "How AI is Transforming Grant Writing for Nonprofits",
                date: "Coming Soon",
              },
              {
                category: "Operations",
                title:
                  "5 Ways to Reduce Administrative Overhead with Automation",
                date: "Coming Soon",
              },
              {
                category: "Impact",
                title:
                  "Measuring What Matters: AI-Powered Impact Reporting",
                date: "Coming Soon",
              },
            ].map((post, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-lg hover:border-brand-100 transition-all duration-300"
              >
                {/* Image placeholder */}
                <div className="aspect-[16/9] bg-slate-50 border-b border-slate-100 flex flex-col items-center justify-center gap-2">
                  <Camera className="h-8 w-8 text-slate-300" />
                  <span className="text-sm text-slate-400 font-medium">
                    Image
                  </span>
                </div>
                <div className="p-6">
                  <span className="inline-block rounded-full bg-brand-50 border border-brand-100 px-3 py-1 text-xs font-semibold text-brand-600 mb-3">
                    {post.category}
                  </span>
                  <h3 className="font-bold text-slate-900 mb-2 leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-sm text-slate-400">{post.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 10. FAQ — Two-column: image LEFT, accordion RIGHT         */}
      {/* ────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 lg:py-32 bg-white">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left — image placeholder */}
            <div className="hidden lg:block sticky top-32">
              <ImagePlaceholder label="Image" aspect="aspect-[3/4]" />
            </div>

            {/* Right — accordion */}
            <div>
              <p className="text-sm font-semibold text-brand-500 uppercase tracking-wider mb-3">
                FAQ
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-10">
                Frequently asked questions
              </h2>

              <div className="space-y-4">
                {faqs.map((faq, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-slate-200 bg-white overflow-hidden transition-colors hover:border-brand-200"
                  >
                    <button
                      className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      aria-expanded={openFaq === i}
                    >
                      <span className="font-semibold text-slate-900">
                        {faq.q}
                      </span>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${
                          openFaq === i ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {openFaq === i && (
                      <div className="px-6 pb-5 -mt-1">
                        <p className="text-slate-500 leading-relaxed">
                          {faq.a}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 11. CTA CLOSING — Full-width purple banner                */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32 relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-500 to-brand-700">
        {/* Subtle decorative shapes */}
        <div className="absolute top-0 left-0 w-[400px] h-[400px] rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-white/5 blur-3xl pointer-events-none" />

        <div className="section-container relative text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              Ready to multiply your nonprofit&apos;s impact?
            </h2>
            <p className="mt-6 text-lg text-white/70 max-w-xl mx-auto">
              Stop drowning in execution. Start leading. Your AI team is ready
              to work.
            </p>
            <div className="mt-10">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-base font-semibold text-brand-600 hover:bg-brand-50 shadow-lg shadow-brand-900/20 transition-all duration-200"
              >
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 12. FOOTER — Multi-column, light background               */}
      {/* ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 bg-slate-50">
        <div className="section-container py-20">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand column */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold tracking-tight text-slate-900">
                  Edify OS
                </span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                AI-powered teams for nonprofits. Multiply your impact without
                multiplying your headcount.
              </p>
            </div>

            {/* Product column */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-5">
                Product
              </h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#features"
                    className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    How it Works
                  </a>
                </li>
                <li>
                  <a
                    href="#agents"
                    className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    AI Team
                  </a>
                </li>
                <li>
                  <a
                    href="#testimonials"
                    className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Testimonials
                  </a>
                </li>
              </ul>
            </div>

            {/* Company column */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-5">
                Company
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/signup"
                    className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Get Started
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Demo
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal / Connect column */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-5">
                Legal
              </h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:hello@edifyos.com"
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    hello@edifyos.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-16 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-400">
              &copy; 2026 Edify OS. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <a
                href="#"
                className="hover:text-slate-600 transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="hover:text-slate-600 transition-colors"
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
