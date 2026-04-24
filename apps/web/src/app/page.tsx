"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SpialNavbar from "@/components/spial-navbar";
import SpialFooter from "@/components/spial-footer";
import { AnimatedDashboard } from "@/components/landing/animated-dashboard";
import { ARCHETYPE_LIST, ArchetypeMark } from "@/components/ui";

/* ── Hero ─────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        padding: "96px 0 128px",
        background: "var(--hero-gradient-marketing), var(--bg-1)",
      }}
    >
      {/* noise texture overlay — home hero only */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: "url('/brand/noise.svg')",
          backgroundRepeat: "repeat",
          opacity: 0.04,
          mixBlendMode: "overlay",
          zIndex: 0,
        }}
      />
      {/* ambient blobs */}
      <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
        <div
          className="absolute"
          style={{
            top: "-10%",
            left: "-15%",
            width: "60%",
            height: "80%",
            background:
              "radial-gradient(circle, rgba(159,78,243,0.22), transparent 60%)",
            filter: "blur(60px)",
            animation: "blob-a 22s ease-in-out infinite",
          }}
        />
        <div
          className="absolute"
          style={{
            bottom: "-30%",
            right: "-10%",
            width: "55%",
            height: "70%",
            background:
              "radial-gradient(circle, rgba(124,58,237,0.18), transparent 60%)",
            filter: "blur(60px)",
            animation: "blob-b 28s ease-in-out infinite",
          }}
        />
      </div>

      <div
        className="mx-auto relative z-[1] px-8"
        style={{ maxWidth: 1240 }}
      >
        <div
          className="grid gap-16 items-center"
          style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.15fr)" }}
        >
          <div>
            <span className="eyebrow">AI STAFF · PRIVATE BETA</span>
            <h1
              style={{
                fontSize: "clamp(44px, 7vw, 92px)",
                fontWeight: 600,
                lineHeight: 0.96,
                letterSpacing: "-0.03em",
                color: "var(--fg-1)",
                margin: "20px 0 24px",
              }}
            >
              Six AI directors.
              <br />
              <span style={{ color: "var(--fg-3)" }}>One mission.</span>
              <br />
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #B06DF5 0%, #9F4EF3 50%, #6B2EB8 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                Your nonprofit.
              </span>
            </h1>
            <p
              className="leading-[1.65] mb-8"
              style={{
                color: "var(--fg-2)",
                fontSize: 19,
                maxWidth: 520,
              }}
            >
              Edify gives small nonprofits six AI directors — one for each role
              you can&apos;t afford to fill. Name them. Train them on your docs.
              They draft, schedule, and report while you approve.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 no-underline"
                style={{
                  background: "var(--brand-purple)",
                  color: "var(--fg-on-purple)",
                  padding: "14px 24px",
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 600,
                  boxShadow: "var(--glow-cta-base)",
                  transition: "box-shadow 200ms ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = "var(--glow-cta-hover)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = "var(--glow-cta-base)";
                }}
              >
                Request early access
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/demo"
                className="no-underline"
                style={{
                  padding: "14px 22px",
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 500,
                  color: "var(--fg-1)",
                  boxShadow: "inset 0 0 0 1px var(--line-2)",
                }}
              >
                See it in action
              </Link>
            </div>
            <div
              className="mt-8 flex items-center gap-3 font-mono"
              style={{
                fontSize: 12,
                color: "var(--fg-3)",
                letterSpacing: "0.08em",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 9999,
                  background: "var(--success)",
                  boxShadow: "0 0 8px var(--success)",
                  animation: "active-pulse 2s ease-in-out infinite",
                }}
              />
              4 PILOT ORGS · 200+ HOURS SAVED THIS MONTH
            </div>
          </div>

          <div className="relative">
            <AnimatedDashboard />
          </div>
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
      title: "You ask.",
      desc: "Chat with any director. Tell them what to do, ask for an update, forward a thread. They understand context.",
    },
    {
      number: "02",
      title: "They draft.",
      desc: "The director pulls from your docs, past emails, and donor history. Work lands in your Approvals queue.",
    },
    {
      number: "03",
      title: "You approve.",
      desc: "Two taps. Send, edit, or discard. Nothing goes out without your signoff — ever.",
    },
  ];

  return (
    <section
      className="relative"
      style={{
        padding: "128px 0",
        background: "#ffffff",
        borderTop: "1px solid #e5e7eb",
      }}
    >
      <div className="mx-auto px-8" style={{ maxWidth: 1240 }}>
        <span className="eyebrow" style={{ color: "var(--brand-purple)" }}>HOW IT WORKS</span>
        <h2
          style={{
            fontSize: "clamp(36px, 5vw, 56px)",
            fontWeight: 600,
            letterSpacing: "-0.025em",
            lineHeight: 1.04,
            margin: "16px 0 24px",
            color: "#111827",
          }}
        >
          You approve.
          <br />
          <span style={{ color: "#6b7280" }}>They do the work.</span>
        </h2>
        <p
          style={{
            color: "#4b5563",
            fontSize: 18,
            maxWidth: 620,
            lineHeight: 1.6,
          }}
        >
          Every draft — every email, every grant report, every calendar move —
          passes through you first. Directors can&apos;t send anything until
          you approve.
        </p>

        <div
          className="grid gap-6 mt-16"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          }}
        >
          {steps.map((s, i) => (
            <div
              key={s.number}
              className="relative overflow-hidden"
              style={{
                padding: 28,
                borderRadius: 16,
                background: "white",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)",
                border: "1px solid #f3f4f6",
              }}
            >
              {i === 2 && (
                <div
                  aria-hidden
                  className="absolute pointer-events-none"
                  style={{
                    top: -30,
                    right: -30,
                    width: 120,
                    height: 120,
                    background:
                      "radial-gradient(circle, rgba(159,78,243,0.12), transparent 60%)",
                    animation: "amber-shift 5s ease-in-out infinite",
                  }}
                />
              )}
              <div className="relative">
                <div
                  className="font-mono"
                  style={{
                    fontSize: 48,
                    fontWeight: 500,
                    color: "var(--brand-purple)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {s.number}
                </div>
                <h3
                  style={{
                    fontSize: 20,
                    fontWeight: 500,
                    margin: "12px 0 8px",
                    color: "#111827",
                  }}
                >
                  {s.title}
                </h3>
                <p
                  style={{
                    color: "#6b7280",
                    fontSize: 14,
                    lineHeight: 1.6,
                  }}
                >
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Meet Your Team ──────────────────────────────────────────── */
function MeetYourTeam() {
  return (
    <section
      id="team"
      style={{
        padding: "128px 0",
        background: "var(--bg-1)",
        borderTop: "1px solid var(--line-1)",
      }}
    >
      <div className="mx-auto px-8" style={{ maxWidth: 1240 }}>
        <span className="eyebrow">YOUR TEAM</span>
        <h2
          style={{
            fontSize: "clamp(36px, 5vw, 56px)",
            fontWeight: 600,
            letterSpacing: "-0.025em",
            lineHeight: 1.04,
            margin: "16px 0 24px",
            color: "var(--fg-1)",
          }}
        >
          Six roles.
          <br />
          <span style={{ color: "var(--fg-3)" }}>Name them anything.</span>
        </h2>
        <p
          style={{
            color: "var(--fg-2)",
            fontSize: 18,
            maxWidth: 620,
            lineHeight: 1.6,
          }}
        >
          They&apos;re archetypes, not personalities. The quirks and voice come
          from you — pick names, set tone, train them on your writing.
        </p>

        <div
          className="grid mt-16"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {ARCHETYPE_LIST.map((arc, i) => (
            <div
              key={arc.key}
              className="relative overflow-hidden transition-transform"
              style={{
                padding: 22,
                borderRadius: 16,
                background: "var(--bg-3)",
                boxShadow: `0 0 0 1px ${arc.color}22, var(--elev-1)`,
                minHeight: 160,
                transitionDuration: "var(--dur-fast)",
                transitionTimingFunction: "var(--ease-standard)",
              }}
            >
              <div
                aria-hidden
                className="absolute pointer-events-none"
                style={{
                  top: -20,
                  right: -20,
                  width: 110,
                  height: 110,
                  background: `radial-gradient(circle, ${arc.color}22, transparent 70%)`,
                  animation: `blob-a ${5 + i * 0.4}s ease-in-out infinite`,
                }}
              />
              <div
                aria-hidden
                className="absolute top-0 left-0 h-full"
                style={{
                  width: 3,
                  background: arc.color,
                  opacity: 0.6,
                }}
              />
              <div className="relative">
                <ArchetypeMark arc={arc} size={36} />
                <div
                  className="mt-3.5 font-mono"
                  style={{
                    fontSize: 11,
                    color: arc.color,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  {arc.role}
                </div>
                <div
                  className="italic"
                  style={{
                    fontSize: 14,
                    color: "var(--fg-4)",
                    marginTop: 4,
                  }}
                >
                  — unnamed —
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--fg-3)",
                    marginTop: 12,
                    lineHeight: 1.5,
                  }}
                >
                  {arc.tagline}.
                </div>
              </div>
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
        "Track hours, certifications, and engagement — flag gaps before events",
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

  const active = tabs[activeTab];

  return (
    <section
      style={{
        padding: "128px 0",
        background: "#f9fafb",
        borderTop: "1px solid #e5e7eb",
      }}
    >
      <div className="mx-auto px-8" style={{ maxWidth: 1240 }}>
        <span className="eyebrow" style={{ color: "var(--brand-purple)" }}>FEATURES</span>
        <h2
          style={{
            fontSize: "clamp(36px, 5vw, 56px)",
            fontWeight: 600,
            letterSpacing: "-0.025em",
            lineHeight: 1.04,
            margin: "16px 0 48px",
            color: "#111827",
          }}
        >
          One platform.
          <br />
          <span style={{ color: "#6b7280" }}>Six roles. Everything covered.</span>
        </h2>

        <div className="flex gap-2.5 mb-10 flex-wrap">
          {tabs.map((t, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className="cursor-pointer transition-all"
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 500,
                background:
                  activeTab === i
                    ? "var(--brand-purple)"
                    : "white",
                color:
                  activeTab === i
                    ? "white"
                    : "#374151",
                boxShadow:
                  activeTab === i
                    ? "0 0 0 1px rgba(159,78,243,0.48), 0 8px 24px rgba(159,78,243,0.32)"
                    : "0 0 0 1px #e5e7eb",
                transitionDuration: "var(--dur-fast)",
                transitionTimingFunction: "var(--ease-standard)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div
          className="grid gap-10 items-start"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}
        >
          <div>
            <h3
              style={{
                fontSize: 26,
                fontWeight: 500,
                color: "#111827",
                marginBottom: 20,
                letterSpacing: "-0.015em",
              }}
            >
              {active.title}
            </h3>
            <ul className="list-none">
              {active.points.map((p, i) => (
                <li
                  key={i}
                  className="flex gap-2.5 mb-4"
                  style={{ color: "#4b5563", lineHeight: 1.6 }}
                >
                  <span
                    className="shrink-0"
                    style={{
                      color: "var(--brand-purple)",
                      fontWeight: 700,
                    }}
                  >
                    •
                  </span>
                  {p}
                </li>
              ))}
            </ul>
            <Link
              href="/features"
              className="no-underline font-medium inline-flex items-center gap-2 mt-5 transition-colors duration-300"
              style={{ color: "var(--brand-purple)" }}
            >
              See all features
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div
            className="relative rounded-[20px] overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(159,78,243,0.08), rgba(124,58,237,0.04))",
              aspectRatio: "4 / 3",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              aria-hidden
              className="absolute inset-0 flex items-center justify-center font-mono"
              style={{
                fontSize: 14,
                color: "#9ca3af",
                letterSpacing: "0.1em",
              }}
            >
              {active.label.toUpperCase()} PREVIEW
            </div>
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
      image: "/blog/ai-wont-replace-your-team.jpg",
      imageAlt: "Diverse team collaborating around a table, sharing a high-five",
    },
    {
      category: "Fundraising",
      title: "The Grant Research Problem Nobody Talks About",
      date: "Apr 1, 2026",
      href: "/blog/grant-research-problem",
      image: "/blog/grant-research-problem.jpg",
      imageAlt: "Two women studying together at a table with a laptop",
    },
    {
      category: "Leadership",
      title: "From Drowning in Admin to Leading with Vision",
      date: "Mar 24, 2026",
      href: "/blog/from-drowning-to-leading",
      image: "/blog/from-drowning-to-leading.jpg",
      imageAlt: "Silhouette of a woman against a dramatic pink and purple sunset sky",
    },
  ];

  return (
    <section
      id="blogs"
      style={{
        padding: "128px 0",
        background: "#ffffff",
        borderTop: "1px solid #e5e7eb",
      }}
    >
      <div className="mx-auto px-8" style={{ maxWidth: 1240 }}>
        <span className="eyebrow" style={{ color: "var(--brand-purple)" }}>FROM THE BLOG</span>
        <h2
          style={{
            fontSize: "clamp(36px, 5vw, 56px)",
            fontWeight: 600,
            letterSpacing: "-0.025em",
            lineHeight: 1.04,
            margin: "16px 0 56px",
            color: "#111827",
          }}
        >
          For the people
          <br />
          <span style={{ color: "#6b7280" }}>doing the work.</span>
        </h2>
        <div
          className="grid gap-8"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          }}
        >
          {blogs.map((b) => (
            <Link
              key={b.href}
              href={b.href}
              className="no-underline block transition-transform"
              style={{
                background: "white",
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)",
                border: "1px solid #f3f4f6",
              }}
            >
              {/* Article cover — real photo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.image}
                alt={b.imageAlt}
                style={{ height: 180, width: "100%", objectFit: "cover", display: "block" }}
              />
              <div className="p-6">
                <div
                  className="font-mono mb-2.5"
                  style={{
                    fontSize: 11,
                    color: "var(--brand-purple)",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                  }}
                >
                  {b.category}
                </div>
                <h3
                  className="font-medium"
                  style={{
                    fontSize: 18,
                    color: "#111827",
                    marginBottom: 10,
                    letterSpacing: "-0.01em",
                    lineHeight: 1.3,
                  }}
                >
                  {b.title}
                </h3>
                <div
                  className="font-mono"
                  style={{ fontSize: 12, color: "#9ca3af" }}
                >
                  {b.date}
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-12">
          <Link
            href="/blog"
            className="no-underline font-medium inline-flex items-center gap-2 transition-colors duration-300"
            style={{ color: "var(--brand-purple)" }}
          >
            Read all articles
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── FAQ ─────────────────────────────────────────────────────── */
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "What is Edify OS?",
      a: "Edify OS is a platform that gives nonprofits access to six AI-powered directors: Executive Assistant, Events Director, Development Director, Marketing Director, Programs Director, and HR & Volunteer Coordinator. Each one has a distinct expertise and a team of specialized subagents. You brief them on your organization and they get to work.",
    },
    {
      q: "Who is this for?",
      a: "Any nonprofit that is resource-constrained and operationally stretched. If your team is wearing too many hats, missing grant deadlines, or struggling to keep communications consistent — Edify OS fills the gaps. It is especially powerful for small to mid-size organizations that cannot afford to hire all the specialists they need.",
    },
    {
      q: "How do the AI team members actually work?",
      a: "Each director has a system prompt that defines their expertise and decision-making style. When you ask them something, they respond in their own voice with recommendations grounded in your organization's context. They can also delegate to specialized subagents for deeper work.",
    },
    {
      q: "What is BYOK and why does it matter?",
      a: "BYOK stands for Bring Your Own Key. You connect your own Claude API key from Anthropic, and all AI calls run directly through your account. This means you only pay for what you use (typically a few cents per conversation), we never see your API key after initial setup, and your data stays in your pipeline.",
    },
    {
      q: "Is my organization's data secure?",
      a: "Your org data stays in your system. The org briefing you complete during onboarding is stored in your session and injected into prompts as context — it does not get shared across organizations or used to train models. We recommend reviewing Anthropic's data policies for details on how API calls are handled on their end.",
    },
    {
      q: "Can I customize how the team works?",
      a: "Yes. During onboarding you brief the team on your org's mission, programs, brand voice, and goals. That context shapes every response. You can also configure each director's proactive heartbeat schedule — how often they check in, what they scan for, and when they stay quiet.",
    },
  ];

  const toggle = (idx: number) => setOpenIndex(openIndex === idx ? null : idx);

  return (
    <section
      style={{
        padding: "128px 0",
        background: "var(--bg-2)",
        borderTop: "1px solid var(--line-1)",
      }}
    >
      <div className="mx-auto px-8 text-center" style={{ maxWidth: 760 }}>
        <h2
          style={{
            fontSize: "clamp(28px, 4vw, 42px)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            marginBottom: 56,
            color: "var(--fg-1)",
          }}
        >
          Frequently asked questions
        </h2>
        <div className="text-left">
          {faqs.map((f, i) => (
            <div
              key={i}
              className="mb-3"
              style={{ borderBottom: "1px solid var(--line-1)" }}
            >
              <button
                className="flex justify-between items-center py-5 cursor-pointer font-medium select-none w-full text-left transition-colors"
                style={{
                  fontSize: 17,
                  color: "var(--fg-1)",
                  background: "transparent",
                  border: "none",
                }}
                onClick={() => toggle(i)}
              >
                <span>{f.q}</span>
                <span
                  className="transition-transform duration-300"
                  style={{
                    fontSize: 24,
                    color: "var(--brand-purple)",
                    transform: openIndex === i ? "rotate(45deg)" : "none",
                  }}
                >
                  +
                </span>
              </button>
              <div
                className="overflow-hidden transition-all duration-300"
                style={{
                  color: "var(--fg-3)",
                  lineHeight: 1.65,
                  maxHeight: openIndex === i ? 500 : 0,
                  paddingBottom: openIndex === i ? 20 : 0,
                }}
              >
                <p style={{ margin: 0 }}>{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Final CTA ─────────────────────────────────────────────── */
function CTASection() {
  return (
    <section
      style={{
        padding: "128px 0",
        background: "var(--bg-1)",
        borderTop: "1px solid var(--line-1)",
      }}
    >
      <div className="mx-auto px-8" style={{ maxWidth: 1040 }}>
        <div
          className="relative overflow-hidden text-center"
          style={{
            padding: "80px 40px",
            borderRadius: 24,
            background:
              "linear-gradient(135deg, var(--bg-plum-2), var(--bg-2))",
            boxShadow:
              "0 0 0 1px var(--line-purple), 0 40px 120px rgba(159,78,243,0.22)",
          }}
        >
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              top: "-40%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "80%",
              height: "120%",
              background:
                "radial-gradient(ellipse, rgba(159,78,243,0.32), transparent 60%)",
              filter: "blur(40px)",
              animation: "blob-a 20s ease-in-out infinite",
            }}
          />
          <div className="relative">
            <span className="eyebrow">LIMITED BETA</span>
            <h2
              style={{
                fontSize: "clamp(36px, 5vw, 64px)",
                fontWeight: 600,
                letterSpacing: "-0.025em",
                lineHeight: 1.04,
                margin: "12px 0 16px",
                color: "var(--fg-1)",
              }}
            >
              Stop drowning.
              <br />
              <span style={{ color: "var(--brand-tint)" }}>Start delegating.</span>
            </h2>
            <p
              style={{
                color: "var(--fg-2)",
                fontSize: 17,
                maxWidth: 540,
                margin: "0 auto 28px",
              }}
            >
              We&apos;re onboarding 20 small nonprofits this quarter. Come tell
              us what&apos;s breaking.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2.5 no-underline"
              style={{
                background: "var(--brand-purple)",
                color: "var(--fg-on-purple)",
                padding: "16px 32px",
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                boxShadow: "var(--glow-cta-base)",
                transition: "box-shadow 200ms ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = "var(--glow-cta-hover)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = "var(--glow-cta-base)";
              }}
            >
              Request early access
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Page ────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div style={{ background: "var(--bg-0)", color: "var(--fg-1)" }}>
      <SpialNavbar />
      <Hero />
      <HowItWorks />
      <MeetYourTeam />
      <FeaturesDeepDive />
      <BlogSection />
      <FAQSection />
      <CTASection />
      <SpialFooter />
    </div>
  );
}
