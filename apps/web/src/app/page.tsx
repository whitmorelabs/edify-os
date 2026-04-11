"use client";

import { useState } from "react";
import {
  ArrowRight,
  Star,
  TrendingUp,
  Globe,
  FolderOpen,
  BarChart3,
} from "lucide-react";
import SpialNavbar from "@/components/spial-navbar";
import SpialFooter from "@/components/spial-footer";
import SectionLabel from "@/components/section-label";
import Placeholder from "@/components/placeholder";

/* ── Hero ─────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="bg-[#1a2b32] py-20 relative overflow-hidden">
      <div className="spial-container relative z-[1]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Text */}
          <div className="mb-10 md:mb-0">
            <h1 className="text-white text-[36px] md:text-[52px] font-semibold leading-[1.2] mb-5">
              Revolutionize your business with next-gen software
            </h1>
            <p className="text-white/80 text-lg mb-[30px] leading-[1.7]">
              We bridge the gap between innovation and execution. From intuitive
              SaaS platforms to sleek app landing pages, our expertise in digital
              marketing &amp; development empowers your brand to thrive in the
              digital age.
            </p>
            <button className="spial-btn">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="flex gap-2.5 mt-[30px]">
              <div className="w-12 h-12 rounded-full bg-[#e5e5e5] border-2 border-[#d2b4fe]" />
              <div className="w-12 h-12 rounded-full bg-[#e5e5e5] border-2 border-[#d2b4fe]" />
              <div className="w-12 h-12 rounded-full bg-[#e5e5e5] border-2 border-[#d2b4fe]" />
            </div>
          </div>

          {/* Visuals */}
          <div className="relative">
            <Placeholder
              className="w-full aspect-[4/3]"
              label="Hero Image"
            />
            <div className="absolute bottom-5 left-5 bg-white/10 backdrop-blur-[10px] rounded-lg p-5 text-white text-sm max-w-[280px]">
              <strong className="block mb-1">88%</strong>
              of users are less likely to return to a site after a poor
              experience
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Amazing Features Section ─────────────────────────────────── */
function AmazingFeatures() {
  return (
    <section className="py-20 bg-[#f7f6f5]" id="features">
      <div className="spial-container">
        <SectionLabel text="Features" />
        <h2 className="text-[28px] md:text-[34px] font-medium text-black mb-5">
          Amazing Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-10">
          <div className="bg-white rounded-xl p-10 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
            <h3 className="text-2xl font-normal mb-4">
              Cross-Platform Compatibility
            </h3>
            <p className="leading-[1.7] text-[#333] mb-4">
              Enjoy a consistent &amp; optimized experience across all
              devices—desktop, tablet, or mobile.
            </p>
            <Placeholder
              className="w-full aspect-[16/9] mt-5 !rounded-lg"
              label="Feature 1"
            />
          </div>
          <div className="bg-white rounded-xl p-10 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
            <h3 className="text-2xl font-normal mb-4">
              Cloud-Based Infrastructure
            </h3>
            <p className="leading-[1.7] text-[#333] mb-4">
              It&apos;s custom SaaS solutions help optimize operations, and
              support scalable growth.
            </p>
            <Placeholder
              className="w-full aspect-[16/9] mt-5 !rounded-lg"
              label="Feature 2"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Innovation Section ───────────────────────────────────────── */
function InnovationSection() {
  const features = [
    "Custom SaaS platforms designed to grow with your business.",
    "Leverage analytics to make informed decisions and drive success.",
    "Streamline processes with innovative, tailored solutions.",
    "Connect all your tools and systems effortlessly for a unified experience.",
  ];

  return (
    <section className="py-20 bg-[#f7f6f5]">
      <div className="spial-container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[60px] items-center">
          <Placeholder
            className="w-full aspect-[4/3]"
            label="Innovation Image"
          />
          <div>
            <h2 className="text-[28px] md:text-[34px] font-medium text-black mb-5">
              Empowering businesses through innovation
            </h2>
            <p className="leading-[1.7] text-[#333] mb-4">
              We empower businesses by combining innovative technology with
              customized solutions that drive efficiency, growth, and success.
            </p>
            <a
              href="#"
              className="text-[#d2b4fe] no-underline font-medium inline-flex items-center gap-2 mt-5 transition-colors duration-300 hover:text-[#c9a3f3]"
            >
              Explore More
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <ul className="list-none mt-[30px]">
              {features.map((f, i) => (
                <li
                  key={i}
                  className="flex gap-4 mb-4 text-base before:content-['\2713'] before:text-[#d2b4fe] before:font-bold before:text-lg before:shrink-0"
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

/* ── Vision Section ───────────────────────────────────────────── */
function VisionSection() {
  const blocks = [
    {
      title: "Empower Businesses",
      desc: "Deliver tools that drive growth & efficiency.",
    },
    {
      title: "Simplify Processes",
      desc: "Create user-friendly and intuitive solutions.",
    },
    {
      title: "Support Scalability",
      desc: "Build solutions that grow with your business.",
    },
  ];

  return (
    <section className="py-20 bg-[#f7f6f5]">
      <div className="spial-container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[60px] items-center">
          <div>
            <h2 className="text-[28px] md:text-[34px] font-medium text-black mb-5">
              Everything you need to transform your vision into reality
            </h2>
            <p className="leading-[1.7] text-[#333] mb-4">
              From custom SaaS solutions to seamless integrations, we provide
              the innovative tools and support you need to achieve your business
              goals.
            </p>
            <button className="spial-btn mt-4">Get Started</button>
          </div>
          <Placeholder className="w-full aspect-[4/3]" label="Vision Image" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">
          {blocks.map((b, i) => (
            <div
              key={i}
              className="bg-white p-[30px] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
            >
              <h3 className="text-xl font-normal mb-3">{b.title}</h3>
              <p className="text-sm text-[#666]">{b.desc}</p>
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
      icon: <TrendingUp className="w-12 h-12 text-[#d2b4fe]" />,
      value: "$6.5m",
      label: "e-commerce Market Growth",
    },
    {
      icon: <Globe className="w-12 h-12 text-[#d2b4fe]" />,
      value: "15+",
      label: "Worldwide Global Reach",
    },
    {
      icon: <FolderOpen className="w-12 h-12 text-[#d2b4fe]" />,
      value: "100+",
      label: "Successful Projects Completed",
    },
    {
      icon: <BarChart3 className="w-12 h-12 text-[#d2b4fe]" />,
      value: "73%",
      label: "Social Media Effectiveness",
    },
  ];

  return (
    <section className="py-20 bg-[#f7f6f5]">
      <div className="spial-container">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mt-10 text-center">
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="mb-4">{s.icon}</div>
              <div className="text-[48px] font-bold text-[#d2b4fe] mb-2.5">
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

/* ── Logos Section ─────────────────────────────────────────────── */
function LogosSection() {
  return (
    <section className="py-20 bg-[#f7f6f5]">
      <div className="spial-container">
        <h2 className="text-[28px] md:text-[34px] font-medium text-black mb-10 text-center">
          Trusted by industry leaders
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-[30px] items-center mt-[50px]">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="flex justify-center items-center min-h-[60px]"
            >
              <div className="w-24 h-8 bg-[#e5e5e5] rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Testimonials Section ─────────────────────────────────────── */
function TestimonialsSection() {
  const reviews = [
    {
      name: "Ronald Richards",
      location: "California, USA",
      text: "Spial\u2019s innovative approach transformed our business operations. The seamless integration and intuitive platform made our transition effortless.",
    },
    {
      name: "Brooklyn Simmons",
      location: "Florida, US",
      text: "Outstanding solution! Their team understood our needs perfectly and delivered exactly what we needed to scale our business efficiently.",
    },
    {
      name: "Leslie Alexander",
      location: "Toronto, US",
      text: "Incredible platform! The analytics features have given us insights we never had before, driving smarter business decisions daily.",
    },
    {
      name: "Savannah Nguyen",
      location: "Georgia, US",
      text: "Best investment we made this year! The support team is responsive and the platform keeps improving with regular updates.",
    },
    {
      name: "Kristin Watson",
      location: "Dallas, US",
      text: "From day one, Spial has been a game-changer. Their customer-centric approach and technical excellence set them apart from competitors.",
    },
    {
      name: "Ralph Edwards",
      location: "Texas, US",
      text: "Perfect solution for enterprises. The scalability and security features give us complete peace of mind running our operations.",
    },
  ];

  return (
    <section className="py-20 bg-[#f7f6f5]">
      <div className="spial-container">
        <div className="flex justify-center">
          <SectionLabel text="Testimonials" />
        </div>
        <div className="text-center mb-[50px]">
          <h2 className="text-[28px] md:text-[34px] font-medium text-black mb-4">
            Clients Review
          </h2>
          <p className="leading-[1.7] text-[#333]">
            Our clients consistently praise the innovation, reliability, and
            exceptional customer support that drives their business success.
          </p>
          <p className="font-semibold mt-5">
            Trusted by businesses worldwide to drive growth
          </p>
          <div className="flex justify-center mt-[30px]">
            <div className="w-[60px] h-[60px] rounded-full bg-[#e5e5e5] border-[3px] border-[#f7f6f5]" />
            <div className="w-[60px] h-[60px] rounded-full bg-[#e5e5e5] border-[3px] border-[#f7f6f5] -ml-4" />
            <div className="w-[60px] h-[60px] rounded-full bg-[#e5e5e5] border-[3px] border-[#f7f6f5] -ml-4" />
          </div>
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
                    <div className="text-sm text-[#999]">{r.location}</div>
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

/* ── Features Deep Dive ───────────────────────────────────────── */
function FeaturesDeepDive() {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      label: "Scalable Architecture",
      title: "Custom SaaS Platforms",
      points: [
        "Build enterprise-grade solutions that scale with your business needs",
        "Cloud infrastructure designed for performance and reliability",
        "Auto-scaling capabilities to handle traffic spikes effortlessly",
      ],
    },
    {
      label: "Real-Time Analytics",
      title: "Dynamic Data Analysis",
      points: [
        "Real-time dashboards that track key performance indicators",
        "Advanced analytics engine for actionable business insights",
        "Customizable reports tailored to your specific needs",
      ],
    },
    {
      label: "Seamless Integration",
      title: "Unified Connections",
      points: [
        "Connect with hundreds of third-party applications and tools",
        "API-first architecture for custom integrations",
        "Webhook support for real-time data synchronization",
      ],
    },
    {
      label: "Advanced Security",
      title: "Enhanced Protection",
      points: [
        "Enterprise-grade encryption for data at rest and in transit",
        "Multi-factor authentication and role-based access control",
        "Regular security audits and compliance with industry standards",
      ],
    },
    {
      label: "Collaborative Tools",
      title: "Effortless Teamwork",
      points: [
        "Real-time collaboration features for distributed teams",
        "Built-in communication and project management tools",
        "Version control and audit trails for complete transparency",
      ],
    },
  ];

  return (
    <section className="py-20 bg-[#392e3b] text-white">
      <div className="spial-container">
        <h2 className="text-[28px] md:text-[34px] font-medium text-white mb-10 text-center">
          Powerful Features for Every Need
        </h2>

        {/* Tab buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 mb-10 flex-wrap">
          {tabs.map((t, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`px-6 py-3 rounded-lg text-sm cursor-pointer transition-all duration-300 border-2 font-[inherit] ${
                activeTab === i
                  ? "bg-[#d2b4fe] text-black border-[#d2b4fe]"
                  : "bg-transparent text-white border-white/20 hover:border-[#d2b4fe]"
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
                  className="mb-4 flex gap-2.5 before:content-['•'] before:text-[#d2b4fe] before:font-bold"
                >
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <Placeholder
            className="w-full aspect-[4/3]"
            label={`Feature Image ${activeTab + 1}`}
          />
        </div>
      </div>
    </section>
  );
}

/* ── Blog Section ─────────────────────────────────────────────── */
function BlogSection() {
  const blogs = [
    {
      category: "Management",
      title:
        "How data-driven strategies boost business growth & visibility",
      date: "Jan 27, 2025",
    },
    {
      category: "Cloud Solutions",
      title: "Cloud-based SaaS unlocking flexibility for businesses",
      date: "Jan 27, 2025",
    },
    {
      category: "Artificial Intelligence",
      title:
        "Building a future-ready business with AI-powered SaaS tools",
      date: "Jan 27, 2025",
    },
  ];

  return (
    <section className="py-20 bg-[#f7f6f5]" id="blogs">
      <div className="spial-container">
        <SectionLabel text="Our Blogs" />
        <h2 className="text-[28px] md:text-[34px] font-medium text-black mb-5">
          Articles &amp; Resources
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[30px] mt-[50px]">
          {blogs.map((b, i) => (
            <div
              key={i}
              className="bg-white rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_8px_16px_rgba(0,0,0,0.1)]"
            >
              <div className="w-full h-[220px] bg-[#e5e5e5]" />
              <div className="p-[25px]">
                <div className="text-xs text-[#d2b4fe] font-semibold uppercase mb-2.5">
                  {b.category}
                </div>
                <h3 className="text-xl font-semibold text-black mb-2.5">
                  {b.title}
                </h3>
                <div className="text-[13px] text-[#999]">{b.date}</div>
              </div>
            </div>
          ))}
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
      q: "How does Spial help businesses grow?",
      a: "Spial provides comprehensive SaaS solutions that streamline operations, enable data-driven decision making, and integrate all your business tools seamlessly. Our platform is designed to scale with your growth and help you achieve your business objectives efficiently.",
    },
    {
      q: "What industries does Spial serve?",
      a: "Spial serves a wide range of industries including SaaS companies, e-commerce platforms, financial services, healthcare, technology startups, and enterprise organizations. Our flexible and customizable solutions can be tailored to meet the specific needs of any industry.",
    },
    {
      q: "Can Spial integrate with our existing systems?",
      a: "Yes, absolutely. Spial offers robust API and webhook support for seamless integration with your existing systems. We support connections with hundreds of popular business applications and can create custom integrations to fit your unique requirements.",
    },
    {
      q: "Is Spial\u2019s platform secure?",
      a: "Security is our top priority. Spial uses enterprise-grade encryption, multi-factor authentication, role-based access controls, and regular security audits. We comply with industry standards including GDPR, SOC 2, and ISO 27001 to protect your data.",
    },
    {
      q: "Does Spial offer mobile-optimized solutions?",
      a: "Yes, Spial is fully optimized for mobile devices. Our platform provides a consistent and intuitive experience across desktop, tablet, and mobile devices, allowing your team to work efficiently from anywhere.",
    },
    {
      q: "How can I track my business\u2019s performance using Spial?",
      a: "Spial provides real-time dashboards and customizable reports that track key performance indicators. Our advanced analytics engine gives you actionable insights, and you can create custom metrics to monitor what matters most to your business.",
    },
  ];

  const toggleAccordion = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-20 bg-[#f7f6f5]">
      <div className="spial-container text-center">
        <h2 className="text-[28px] md:text-[34px] font-medium text-black mb-[50px]">
          Frequently Asked Questions
        </h2>
        <div className="max-w-[700px] mx-auto mt-[50px] text-left">
          {faqs.map((f, i) => (
            <div key={i} className="border-b border-[#ddd] mb-5">
              <div
                className="flex justify-between items-center py-5 cursor-pointer font-medium text-lg select-none hover:text-[#d2b4fe] transition-colors duration-300"
                onClick={() => toggleAccordion(i)}
              >
                <span>{f.q}</span>
                <span
                  className={`text-2xl text-[#d2b4fe] transition-transform duration-300 ${
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
    <section className="pt-[40px] pb-[100px] bg-[#f7f6f5]">
      <div className="spial-container flex flex-col items-center justify-center text-center">
        <h2 className="text-[28px] md:text-[42px] font-medium text-black max-w-[600px] leading-[1.3] mb-16">
          Join today &amp; empower your team to achieve extraordinary goals
          together
        </h2>
        <button className="spial-btn">
          Let&apos;s Collaborate Now
        </button>
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
      <AmazingFeatures />
      <InnovationSection />
      <VisionSection />
      <StatsSection />
      <LogosSection />
      <TestimonialsSection />
      <FeaturesDeepDive />
      <BlogSection />
      <FAQSection />
      <CTASection />
      <SpialFooter />
    </div>
  );
}
