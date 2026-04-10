import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  CheckCircle,
  Building,
  Zap,
  Shield,
  Landmark,
  Megaphone,
  CalendarCheck,
} from "lucide-react";

const agents = [
  {
    icon: Landmark,
    name: "Director of Development",
    color: "bg-emerald-500",
    lightBg: "bg-emerald-50",
    lightText: "text-emerald-700",
    border: "border-emerald-500",
    capabilities: [
      "Research grant opportunities",
      "Draft donor outreach emails",
      "Track fundraising pipeline",
    ],
  },
  {
    icon: Megaphone,
    name: "Marketing Director",
    color: "bg-amber-500",
    lightBg: "bg-amber-50",
    lightText: "text-amber-700",
    border: "border-amber-500",
    capabilities: [
      "Create social media campaigns",
      "Write newsletters and blog posts",
      "Analyze engagement metrics",
    ],
  },
  {
    icon: CalendarCheck,
    name: "Executive Assistant",
    color: "bg-sky-500",
    lightBg: "bg-sky-50",
    lightText: "text-sky-700",
    border: "border-sky-500",
    capabilities: [
      "Triage and draft email responses",
      "Prepare meeting agendas",
      "Manage tasks and schedules",
    ],
  },
];

const steps = [
  {
    number: "01",
    title: "Tell us about your mission",
    description:
      "Share your organization details, programs, and brand voice. Your AI team learns your context.",
    icon: Building,
  },
  {
    number: "02",
    title: "Your agents get to work",
    description:
      "AI team members research, draft, and execute tasks 24/7 — grants, campaigns, emails, and more.",
    icon: Zap,
  },
  {
    number: "03",
    title: "Review and approve",
    description:
      "You stay in control. Review recommendations, approve actions, and direct your team.",
    icon: Shield,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">Edify OS</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Sign In
            </Link>
            <Link href="/signup" className="btn-primary text-sm">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="hero-gradient absolute inset-0 opacity-5" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
              <Sparkles className="h-4 w-4" />
              AI-Powered Teams for Nonprofits
            </div>
            <h1 className="heading-display">
              Your nonprofit just hired its{" "}
              <span className="bg-gradient-to-r from-brand-500 to-sky-500 bg-clip-text text-transparent">
                smartest team.
              </span>
            </h1>
            <p className="mt-6 text-xl text-slate-600 leading-relaxed max-w-2xl">
              Edify OS gives your organization a Director of Development,
              Marketing Director, and Executive Assistant — all AI-powered, all
              working around the clock.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/signup" className="btn-primary text-base px-8 py-3">
                Start Free
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#how-it-works"
                className="btn-secondary text-base px-8 py-3"
              >
                See How It Works
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Meet Your AI Team */}
      <section className="border-t border-slate-100 bg-slate-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="heading-1">Meet Your AI Team</h2>
            <p className="mt-3 text-lg text-slate-500 max-w-2xl mx-auto">
              Each role comes with specialized expertise and a network of
              subagents that execute work continuously.
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {agents.map((agent) => (
              <div
                key={agent.name}
                className={`card overflow-hidden border-t-4 ${agent.border} p-6`}
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl ${agent.color}`}
                >
                  <agent.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  {agent.name}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {agent.capabilities.map((cap) => (
                    <li
                      key={cap}
                      className="flex items-start gap-2 text-sm text-slate-600"
                    >
                      <CheckCircle
                        className={`mt-0.5 h-4 w-4 shrink-0 ${agent.lightText}`}
                      />
                      {cap}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="heading-1">How It Works</h2>
            <p className="mt-3 text-lg text-slate-500">
              Go from signup to a fully operational AI team in minutes.
            </p>
          </div>

          <div className="mt-16 grid gap-12 lg:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50">
                  <step.icon className="h-6 w-6 text-brand-500" />
                </div>
                <div className="mt-4">
                  <span className="text-sm font-bold text-brand-500">
                    Step {step.number}
                  </span>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="border-y border-slate-100 bg-slate-50 py-16">
        <div className="mx-auto grid max-w-4xl grid-cols-3 gap-8 px-6 text-center">
          <div>
            <p className="text-3xl font-extrabold text-brand-500">500+</p>
            <p className="mt-1 text-sm text-slate-500">Nonprofits Served</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-brand-500">10,000+</p>
            <p className="mt-1 text-sm text-slate-500">Tasks Completed</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-brand-500">95%</p>
            <p className="mt-1 text-sm text-slate-500">Approval Rate</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="hero-gradient py-24">
        <div className="mx-auto max-w-2xl px-6 text-center text-white">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Ready to multiply your team&apos;s impact?
          </h2>
          <p className="mt-4 text-lg text-white/80">
            Stop drowning in execution. Start leading.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3 text-base font-semibold text-brand-700 shadow-lg hover:bg-slate-50 transition-colors"
          >
            Get Started Free
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-500">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold text-slate-900">Edify OS</span>
            </div>
            <p className="text-sm text-slate-400">
              &copy; 2026 Edify OS. AI-Powered Teams for Nonprofits.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
