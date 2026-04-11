"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Star,
  Menu,
  X,
  Mail,
  TrendingUp,
  Globe,
  FolderOpen,
  BarChart3,
  Shield,
  Zap,
  Users,
  Link2,
  Layers,
  MonitorSmartphone,
  Cloud,
  Lightbulb,
  MessageSquare,
} from "lucide-react";

/* ── Navigation ───────────────────────────────────────────────── */
function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = ["About", "Features", "Blogs", "Pricing"];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
          SPIAL
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link key={l} href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              {l}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:block">
          <Link
            href="#"
            className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-gray-700"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-3">
          {links.map((l) => (
            <Link key={l} href="#" className="block text-sm text-gray-600 hover:text-gray-900 py-1">
              {l}
            </Link>
          ))}
          <Link
            href="#"
            className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white mt-2"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </nav>
  );
}

/* ── Hero ─────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="pt-28 pb-20 lg:pt-36 lg:pb-28 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Text — left-aligned */}
        <div className="max-w-2xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-[1.1]">
            Revolutionize your business with next-gen software
          </h1>
          <p className="mt-6 text-lg text-gray-500 leading-relaxed max-w-xl">
            We bridge the gap between innovation and execution. From intuitive SaaS platforms to sleek app landing pages, our expertise in digital marketing, &amp; development empowers your brand to thrive in the digital age.
          </p>
          <div className="mt-8">
            <Link
              href="#"
              className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Hero image area with overlaid cards */}
        <div className="relative mt-16">
          {/* Main image placeholder */}
          <div className="w-full aspect-[16/8] bg-gray-100 rounded-2xl border border-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-sm">Hero Image — Team working together</span>
          </div>

          {/* Overlaid UI cards */}
          <div className="absolute top-6 right-6 bg-white rounded-xl shadow-lg p-4 w-48 hidden sm:block">
            <p className="text-xs text-gray-500 mb-1">Proposal Progress</p>
            <div className="flex items-end gap-1 h-10">
              {[40, 65, 50, 80, 60, 90, 75].map((h, i) => (
                <div key={i} className="flex-1 bg-gray-900 rounded-sm" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>

          <div className="absolute bottom-8 left-6 bg-white rounded-xl shadow-lg p-4 hidden sm:block">
            <p className="text-xs text-gray-500 mb-1">Sales Statistic</p>
            <p className="text-2xl font-bold text-gray-900">$24,740</p>
            <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +12.5% this month
            </p>
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg p-4 hidden sm:block">
            <p className="text-xs text-gray-500 mb-1">Active Users</p>
            <p className="text-xl font-bold text-gray-900">3,842</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Features — "Empowering businesses" ───────────────────────── */
function FeaturesMain() {
  const bullets = [
    "Custom SaaS platforms designed to grow with your business.",
    "Leverage analytics to make informed decisions and drive success.",
    "Streamline processes with innovative, tailored solutions.",
    "Connect all your tools and systems effortlessly for a unified experience.",
  ];

  return (
    <section className="py-20 lg:py-28 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Full-width image placeholder */}
        <div className="w-full aspect-[16/7] bg-gray-100 rounded-2xl border border-gray-200 flex items-center justify-center mb-16">
          <span className="text-gray-400 text-sm">Image — People in office</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: text */}
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 leading-[1.15]">
              Empowering businesses through innovation
            </h2>
            <p className="mt-5 text-gray-500 text-lg leading-relaxed">
              We empower businesses by combining innovative technology with customized solutions that drive efficiency, growth, and success.
            </p>
            <div className="mt-8">
              <Link
                href="#"
                className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
              >
                Explore More <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right: arrow bullet list */}
          <div className="space-y-5 pt-2">
            {bullets.map((b, i) => (
              <div key={i} className="flex items-start gap-3">
                <ArrowRight className="w-5 h-5 text-gray-900 mt-0.5 shrink-0" />
                <p className="text-gray-600 leading-relaxed">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Cross-Platform Section ───────────────────────────────────── */
function CrossPlatform() {
  const checks = [
    "Responsive web applications",
    "Native mobile experience",
    "Desktop integration",
  ];

  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: text */}
          <div>
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-violet-600 bg-violet-50 rounded-full px-4 py-1.5 mb-5">
              Cross-Platform Compatibility
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 leading-[1.15]">
              Seamless access across all devices
            </h2>
            <p className="mt-5 text-gray-500 text-lg leading-relaxed">
              Experience uninterrupted access to your tools and data across every device. Our platform adapts to your workflow, whether you&apos;re on desktop, tablet, or mobile.
            </p>
            <div className="mt-6 space-y-3">
              {checks.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-gray-700">{c}</span>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Link href="#" className="inline-flex items-center gap-1.5 text-violet-600 font-medium text-sm hover:text-violet-700 transition-colors">
                Explore more <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right: image placeholder */}
          <div className="aspect-[4/3] bg-gray-100 rounded-2xl border border-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-sm">Cross-Platform Image</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Cloud Infrastructure Section ─────────────────────────────── */
function CloudInfra() {
  const checks = [
    "Auto-scaling architecture",
    "99.9% uptime guarantee",
    "Global CDN distribution",
  ];

  return (
    <section className="py-20 lg:py-28 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: image placeholder */}
          <div className="aspect-[4/3] bg-gray-100 rounded-2xl border border-gray-200 flex items-center justify-center order-2 lg:order-1">
            <span className="text-gray-400 text-sm">Cloud Infrastructure Image</span>
          </div>

          {/* Right: text */}
          <div className="order-1 lg:order-2">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-violet-600 bg-violet-50 rounded-full px-4 py-1.5 mb-5">
              Cloud-Based Infrastructure
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 leading-[1.15]">
              Scalable and reliable cloud solutions
            </h2>
            <p className="mt-5 text-gray-500 text-lg leading-relaxed">
              Built on modern cloud architecture that scales with your business. Enjoy enterprise-grade reliability with the flexibility to grow without limits.
            </p>
            <div className="mt-6 space-y-3">
              {checks.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-gray-700">{c}</span>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Link href="#" className="inline-flex items-center gap-1.5 text-violet-600 font-medium text-sm hover:text-violet-700 transition-colors">
                Explore more <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Innovation / Vision Section ──────────────────────────────── */
function Innovation() {
  const pillars = [
    {
      icon: Zap,
      title: "Empower Businesses",
      desc: "Deliver tools that drive growth & efficiency.",
    },
    {
      icon: Lightbulb,
      title: "Simplify Processes",
      desc: "Create user-friendly and intuitive solutions.",
    },
    {
      icon: Layers,
      title: "Support Scalability",
      desc: "Build solutions that grow with your business.",
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Full-width image placeholder */}
        <div className="w-full aspect-[16/7] bg-gray-100 rounded-2xl border border-gray-200 flex items-center justify-center mb-16">
          <span className="text-gray-400 text-sm">Innovation Image</span>
        </div>

        <div className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 leading-[1.15]">
            Everything you need to transform your vision into reality
          </h2>
          <p className="mt-5 text-gray-500 text-lg leading-relaxed">
            Our comprehensive suite of tools and expertise helps you turn ambitious ideas into market-ready products. From concept to launch, we&apos;re with you every step of the way.
          </p>
          <div className="mt-8">
            <Link
              href="#"
              className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Three-column pillars */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          {pillars.map((p, i) => (
            <div key={i} className="text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
                <p.icon className="w-6 h-6 text-gray-900" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{p.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Statistics Section ───────────────────────────────────────── */
function Statistics() {
  const stats = [
    { icon: BarChart3, value: "$6.5m", label: "e-commerce Market Growth", color: "bg-emerald-500" },
    { icon: Globe, value: "15+", label: "Worldwide Global Reach", color: "bg-blue-500" },
    { icon: FolderOpen, value: "100+", label: "Projects", color: "bg-amber-500" },
    { icon: TrendingUp, value: "73%", label: "Social Effectiveness", color: "bg-violet-500" },
  ];

  return (
    <section className="py-20 lg:py-28 bg-[#1a1a2e]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <div key={i} className="bg-[#22223a] rounded-2xl p-8 text-center">
              <div className={`mx-auto w-12 h-12 rounded-full ${s.color} bg-opacity-20 flex items-center justify-center mb-5`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold text-white mb-2">{s.value}</p>
              <p className="text-gray-400 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Logo Carousel ────────────────────────────────────────────── */
function LogoCarousel() {
  return (
    <section className="py-16 lg:py-20 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
        <p className="text-sm text-gray-400 uppercase tracking-widest mb-10">
          Trusted by leading companies
        </p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-8 items-center">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-xs font-medium">Logo {i + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Testimonials ─────────────────────────────────────────────── */
function Testimonials() {
  const testimonials = [
    {
      name: "Sarah Mitchell",
      location: "New York, USA",
      text: "Spial transformed our business operations. The platform is incredibly intuitive and the results speak for themselves. Our productivity increased by 40% in just three months.",
      rating: 5,
    },
    {
      name: "James Rodriguez",
      location: "London, UK",
      text: "The cross-platform capabilities are game-changing. Our team can now work seamlessly whether they're in the office or on the go. Truly outstanding service.",
      rating: 5,
    },
    {
      name: "Emily Chen",
      location: "Singapore",
      text: "Outstanding support and a product that actually delivers on its promises. The cloud infrastructure has been rock-solid and the scaling is effortless.",
      rating: 5,
    },
  ];

  const [active, setActive] = useState(0);

  return (
    <section className="py-20 lg:py-28 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
            What our clients say about us
          </h2>
          <p className="mt-4 text-gray-500 text-lg max-w-2xl mx-auto">
            Hear from the businesses we&apos;ve helped transform with our innovative solutions.
          </p>
        </div>

        {/* Client thumbnails */}
        <div className="flex justify-center gap-4 mb-10">
          {testimonials.map((t, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`w-12 h-12 rounded-full bg-gray-200 border-2 transition-all flex items-center justify-center text-xs font-bold text-gray-500 ${
                active === i ? "border-gray-900 ring-2 ring-gray-900/20" : "border-transparent"
              }`}
            >
              {t.name.charAt(0)}
            </button>
          ))}
        </div>

        {/* Testimonial card */}
        <div className="max-w-2xl mx-auto bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="flex justify-center gap-1 mb-4">
            {Array.from({ length: testimonials[active].rating }).map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <p className="text-gray-600 leading-relaxed text-lg italic mb-6">
            &ldquo;{testimonials[active].text}&rdquo;
          </p>
          <p className="font-semibold text-gray-900">{testimonials[active].name}</p>
          <p className="text-sm text-gray-400">{testimonials[active].location}</p>
        </div>

        {/* Navigation arrows */}
        <div className="flex justify-center gap-3 mt-8">
          <button
            onClick={() => setActive((p) => (p === 0 ? testimonials.length - 1 : p - 1))}
            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActive((p) => (p === testimonials.length - 1 ? 0 : p + 1))}
            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ── Detailed Features ────────────────────────────────────────── */
const detailedFeatures = [
  {
    icon: MonitorSmartphone,
    title: "Custom SaaS Platforms",
    desc: "Tailored software-as-a-service platforms built to match your unique business needs and workflows.",
    question: "How does Custom SaaS Platforms work?",
    benefits: [
      "Fully customizable dashboards and interfaces",
      "Role-based access control and permissions",
      "Automated workflows and integrations",
    ],
  },
  {
    icon: BarChart3,
    title: "Dynamic Data Analysis",
    desc: "Real-time analytics and reporting tools that turn your data into actionable business insights.",
    question: "How does Dynamic Data Analysis work?",
    benefits: [
      "Real-time data visualization and dashboards",
      "Predictive analytics and trend forecasting",
      "Automated report generation and scheduling",
    ],
  },
  {
    icon: Link2,
    title: "Unified Connections",
    desc: "Seamlessly integrate all your tools, platforms, and data sources into a single unified experience.",
    question: "How does Unified Connections work?",
    benefits: [
      "Connect 100+ popular business tools",
      "Bi-directional data sync across platforms",
      "Custom API integrations and webhooks",
    ],
  },
  {
    icon: Shield,
    title: "Enhanced Protection",
    desc: "Enterprise-grade security measures to protect your data, users, and business operations.",
    question: "How does Enhanced Protection work?",
    benefits: [
      "End-to-end encryption for all data",
      "Multi-factor authentication and SSO",
      "Compliance with GDPR, SOC2, and HIPAA",
    ],
  },
  {
    icon: Users,
    title: "Effortless Teamwork",
    desc: "Collaboration tools that bring your team together, no matter where they are in the world.",
    question: "How does Effortless Teamwork work?",
    benefits: [
      "Real-time collaboration on documents",
      "Built-in video conferencing and chat",
      "Shared workspaces and project boards",
    ],
  },
];

function DetailedFeatures() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
            Powerful features for modern businesses
          </h2>
          <p className="mt-4 text-gray-500 text-lg max-w-2xl mx-auto">
            Everything you need to build, scale, and manage your digital products.
          </p>
        </div>

        {/* Feature cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {detailedFeatures.map((f, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-gray-900" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Expandable details */}
        <div className="max-w-3xl mx-auto space-y-3">
          {detailedFeatures.map((f, i) => (
            <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">{f.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    expanded === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {expanded === i && (
                <div className="px-6 pb-5 space-y-2">
                  {f.benefits.map((b, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-emerald-600" />
                      </div>
                      <span className="text-gray-600 text-sm">{b}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Blog Section ─────────────────────────────────────────────── */
function BlogSection() {
  const posts = [
    {
      category: "Technology",
      title: "The Future of SaaS: Trends to Watch in 2025",
      date: "March 15, 2025",
    },
    {
      category: "Business",
      title: "How AI is Transforming Small Business Operations",
      date: "March 10, 2025",
    },
    {
      category: "Design",
      title: "Building User-Centric Products That Scale",
      date: "March 5, 2025",
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
            Our Recent Blogs
          </h2>
          <p className="mt-4 text-gray-500 text-lg">
            Insights, tips, and trends from our team of experts.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {posts.map((p, i) => (
            <Link key={i} href="#" className="group">
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
                {/* Image placeholder */}
                <div className="aspect-[16/10] bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">Blog Image</span>
                </div>
                <div className="p-6">
                  <span className="inline-block text-xs font-semibold uppercase tracking-wider text-violet-600 bg-violet-50 rounded-full px-3 py-1 mb-3">
                    {p.category}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-violet-600 transition-colors mb-2">
                    {p.title}
                  </h3>
                  <p className="text-sm text-gray-400">{p.date}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── FAQ Section ──────────────────────────────────────────────── */
function FAQ() {
  const faqs = [
    { q: "What services does Spial offer?", a: "Spial provides comprehensive digital solutions including custom SaaS platforms, data analytics, cross-platform applications, cloud infrastructure, and enterprise security solutions." },
    { q: "How long does a typical project take?", a: "Project timelines vary based on scope and complexity. A typical SaaS platform takes 3-6 months, while simpler solutions can be delivered in 4-8 weeks." },
    { q: "Do you offer ongoing support?", a: "Yes, we provide 24/7 support and maintenance for all our solutions. Our dedicated support team ensures your platform runs smoothly at all times." },
    { q: "Can I customize the platform?", a: "Absolutely. Every solution we build is fully customizable. We work closely with you to ensure the platform matches your exact business requirements." },
    { q: "What is your pricing model?", a: "We offer flexible pricing based on project scope and requirements. Contact us for a detailed quote tailored to your specific needs." },
    { q: "How do you ensure data security?", a: "We implement enterprise-grade security measures including end-to-end encryption, multi-factor authentication, and compliance with major security standards." },
  ];

  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: image placeholder */}
          <div className="aspect-[4/3] bg-gray-100 rounded-2xl border border-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-sm">FAQ Image</span>
          </div>

          {/* Right: accordion */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 mb-8">
              Frequently asked questions
            </h2>
            <div className="space-y-3">
              {faqs.map((f, i) => (
                <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpen(open === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-gray-900 pr-4">{f.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${
                        open === i ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {open === i && (
                    <div className="px-5 pb-4">
                      <p className="text-gray-500 text-sm leading-relaxed">{f.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── CTA Closing Section ──────────────────────────────────────── */
function CtaClosing() {
  return (
    <section className="py-20 lg:py-28 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 leading-[1.15] max-w-3xl mx-auto">
          Ready to transform your business? Let&apos;s build something great together.
        </h2>
        <p className="mt-6 text-gray-500 text-lg max-w-2xl mx-auto">
          Partner with us to create innovative solutions that drive growth and set you apart from the competition.
        </p>
        <div className="mt-10">
          <Link
            href="#"
            className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-8 py-4 text-base font-medium text-white hover:bg-gray-800 transition-colors"
          >
            Let&apos;s Collaborate Now <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Footer ───────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="bg-gray-100 pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
              SPIAL
            </Link>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed max-w-xs">
              Empowering businesses with next-generation software solutions. From SaaS platforms to digital marketing, we help your brand thrive.
            </p>
            {/* Contact */}
            <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
              <Mail className="w-4 h-4" />
              <span>hello@spial.io</span>
            </div>
            {/* Social icons */}
            <div className="mt-4 flex gap-3">
              {["X", "In", "Fb", "Ig"].map((s) => (
                <Link
                  key={s}
                  href="#"
                  className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 hover:bg-gray-300 transition-colors"
                >
                  {s}
                </Link>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 text-sm">Product</h4>
            <ul className="space-y-2.5">
              {["About", "Features", "Blogs", "Pricing"].map((l) => (
                <li key={l}>
                  <Link href="#" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 text-sm">Company</h4>
            <ul className="space-y-2.5">
              {["FAQ", "Reviews", "Integrations"].map((l) => (
                <li key={l}>
                  <Link href="#" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Utilities */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 text-sm">Utilities</h4>
            <ul className="space-y-2.5">
              {["Licensing", "Changelog"].map((l) => (
                <li key={l}>
                  <Link href="#" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400">&copy; 2025 Spial. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Terms &amp; Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ── Page Assembly ────────────────────────────────────────────── */
export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <FeaturesMain />
      <CrossPlatform />
      <CloudInfra />
      <Innovation />
      <Statistics />
      <LogoCarousel />
      <Testimonials />
      <DetailedFeatures />
      <BlogSection />
      <FAQ />
      <CtaClosing />
      <Footer />
    </main>
  );
}
