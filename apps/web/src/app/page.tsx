import Link from "next/link";
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
  Play,
  Star,
  Users,
  Target,
  Clock,
} from "lucide-react";

/* ── Agent data ────────────────────────────────────────────────── */
const agents = [
  {
    icon: Landmark,
    name: "Director of Development",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
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
    border: "border-amber-500/30",
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
    border: "border-sky-500/30",
    capabilities: [
      "Email triage & drafting",
      "Meeting preparation",
      "Schedule management",
      "Task coordination",
    ],
  },
];

/* ── Platform steps ────────────────────────────────────────────── */
const steps = [
  {
    num: "01",
    title: "Tell us your mission",
    desc: "Share your organization details, programs, and brand voice. Your AI team learns your unique context and communication style.",
  },
  {
    num: "02",
    title: "Your team gets to work",
    desc: "AI agents research grants, draft campaigns, triage emails, and manage tasks — all running 24/7 in the background.",
  },
  {
    num: "03",
    title: "Review & approve",
    desc: "Every output lands in your approval queue. You stay in control — approve, edit, or redirect with a single click.",
  },
  {
    num: "04",
    title: "Scale your impact",
    desc: "As trust grows, increase autonomy. Your AI team handles more while you focus on strategy, leadership, and community.",
  },
];

/* ── Stats ─────────────────────────────────────────────────────── */
const stats = [
  { value: "10x", label: "Capacity multiplier", icon: Zap },
  { value: "24/7", label: "Always working", icon: Clock },
  { value: "95%", label: "Approval rate", icon: Target },
  { value: "500+", label: "Nonprofits served", icon: Users },
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

/* ── Features ──────────────────────────────────────────────────── */
const features = [
  {
    icon: Shield,
    title: "Your data, your control",
    desc: "Bring your own API key. Your data is encrypted at rest and never used for training. Full privacy by design.",
  },
  {
    icon: Zap,
    title: "Proactive, not reactive",
    desc: "The heartbeat system monitors grants, emails, and social media — surfacing opportunities before you even ask.",
  },
  {
    icon: BarChart3,
    title: "Confidence scoring",
    desc: "Every output includes a confidence score. High confidence auto-executes. Low confidence asks for your input.",
  },
];

/* ═══════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dark text-white overflow-hidden">
      {/* ── Nav ───────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-dark/80 backdrop-blur-xl">
        <div className="section-container flex items-center justify-between py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500">
              <Sparkles className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-lg font-bold">Edify OS</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-white/60 hover:text-white transition">Features</a>
            <a href="#how-it-works" className="text-sm text-white/60 hover:text-white transition">How it Works</a>
            <a href="#team" className="text-sm text-white/60 hover:text-white transition">AI Team</a>
            <a href="#testimonials" className="text-sm text-white/60 hover:text-white transition">Testimonials</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-brand-300 hover:text-brand-200 font-medium transition">
              Demo
            </Link>
            <Link href="/login" className="text-sm text-white/60 hover:text-white transition hidden sm:block">
              Sign In
            </Link>
            <Link href="/signup" className="btn-primary text-sm !py-2.5 !px-5">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative section-padding overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] glow-purple-intense pointer-events-none" />

        <div className="section-container relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 border border-brand-500/20 px-4 py-2 text-sm font-medium text-brand-300 mb-8">
              <Sparkles className="h-4 w-4" />
              AI-Powered Teams for Nonprofits
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
              Your nonprofit just hired its{" "}
              <span className="text-brand-400">smartest team</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-white/50 leading-relaxed max-w-2xl mx-auto">
              Edify OS gives your organization a full AI leadership team — a
              Director of Development, Marketing Director, and Executive
              Assistant — working around the clock.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link href="/signup" className="btn-primary text-base !px-8 !py-3.5">
                Start Free
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a href="#how-it-works" className="btn-light text-base">
                <Play className="h-4 w-4" />
                See How It Works
              </a>
            </div>

            {/* Trust badges */}
            <div className="mt-16 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-white/30">
              <span className="flex items-center gap-1.5"><Shield className="h-4 w-4" /> SOC 2 Compliant</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> BYOK Encryption</span>
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> 500+ Nonprofits</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ──────────────────────────────────────── */}
      <section className="border-y border-white/5">
        <div className="section-container py-16">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 mb-4">
                  <s.icon className="h-6 w-6 text-brand-400" />
                </div>
                <p className="text-3xl sm:text-4xl font-extrabold text-white">{s.value}</p>
                <p className="mt-1 text-sm text-white/40">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features (3 cards) ───────────────────────────────── */}
      <section id="features" className="section-padding">
        <div className="section-container">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-brand-400 uppercase tracking-wider mb-3">Why Edify OS</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Built for nonprofits that need<br className="hidden sm:block" /> to do more with less
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="card-dark p-8 hover:border-brand-500/30 transition-colors">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 mb-5">
                  <f.icon className="h-6 w-6 text-brand-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works (numbered steps) ────────────────────── */}
      <section id="how-it-works" className="section-padding bg-white text-slate-900">
        <div className="section-container">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-brand-500 uppercase tracking-wider mb-3">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              From signup to a full AI team<br className="hidden sm:block" /> in under 5 minutes
            </h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {steps.map((s, i) => (
              <div key={s.num} className="flex gap-6 group">
                <div className="shrink-0">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 text-lg font-extrabold group-hover:bg-brand-500 group-hover:text-white transition-colors">
                    {s.num}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Meet your AI Team ────────────────────────────────── */}
      <section id="team" className="section-padding section-dark relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] glow-purple pointer-events-none" />

        <div className="section-container relative">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-brand-400 uppercase tracking-wider mb-3">Your AI Team</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Three leaders. Twelve subagents.<br className="hidden sm:block" /> One unstoppable team.
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {agents.map((a) => (
              <div key={a.name} className={`card-dark p-8 border ${a.border} hover:border-opacity-60 transition-all`}>
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${a.bg} mb-6`}>
                  <a.icon className={`h-7 w-7 ${a.color}`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{a.name}</h3>
                <ul className="space-y-2.5">
                  {a.capabilities.map((cap) => (
                    <li key={cap} className="flex items-center gap-2.5 text-sm text-white/50">
                      <CheckCircle className={`h-4 w-4 shrink-0 ${a.color}`} />
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

      {/* ── Testimonials ─────────────────────────────────────── */}
      <section id="testimonials" className="section-padding bg-white text-slate-900">
        <div className="section-container">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-brand-500 uppercase tracking-wider mb-3">Testimonials</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Loved by nonprofit leaders
            </h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl border border-slate-200 p-8 hover:shadow-lg transition-shadow">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-brand-500 text-brand-500" />
                  ))}
                </div>
                <Quote className="h-8 w-8 text-brand-200 mb-3" />
                <p className="text-slate-600 leading-relaxed mb-6">
                  {t.quote}
                </p>
                <div>
                  <p className="font-bold text-slate-900">{t.name}</p>
                  <p className="text-sm text-slate-400">{t.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="section-padding section-dark relative">
        <div className="absolute inset-0 glow-purple-intense pointer-events-none" />

        <div className="section-container relative text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight max-w-2xl mx-auto">
            Ready to multiply your{" "}
            <span className="text-brand-400">nonprofit&apos;s impact</span>?
          </h2>
          <p className="mt-4 text-lg text-white/50 max-w-xl mx-auto">
            Stop drowning in execution. Start leading. Your AI team is ready to work.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/signup" className="btn-primary text-base !px-8 !py-3.5">
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/dashboard" className="btn-light text-base">
              Try the Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-white/5 bg-dark">
        <div className="section-container py-12">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold">Edify OS</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/30">
              <a href="#features" className="hover:text-white/60 transition">Features</a>
              <a href="#how-it-works" className="hover:text-white/60 transition">How it Works</a>
              <a href="#team" className="hover:text-white/60 transition">Team</a>
              <Link href="/login" className="hover:text-white/60 transition">Sign In</Link>
            </div>
            <p className="text-sm text-white/20">
              &copy; 2026 Edify OS
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
