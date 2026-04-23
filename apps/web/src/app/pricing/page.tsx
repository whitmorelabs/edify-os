import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import SpialNavbar from "@/components/spial-navbar";
import SpialFooter from "@/components/spial-footer";
import { Button } from "@/components/ui";

export const metadata = {
  title: "Pricing | Edify OS",
  description: "Simple, transparent pricing for nonprofits. Bring your own API key -- you only pay for what you use.",
};

const tiers = [
  {
    name: "Starter",
    price: "$49",
    period: "/month",
    desc: "For small nonprofits getting started with AI. One user, all 6 directors, core features.",
    highlight: false,
    features: [
      "All 6 AI directors",
      "Bring your own API key (BYOK)",
      "Org briefing and context memory",
      "Team chat and task delegation",
      "Decision Lab (up to 10 scenarios/month)",
      "Heartbeat check-ins (daily)",
      "1 user seat",
      "Email support",
    ],
    cta: "Get started",
    href: "/signup",
  },
  {
    name: "Growth",
    price: "$149",
    period: "/month",
    desc: "For growing nonprofits with active development and communications needs. Up to 5 users.",
    highlight: true,
    features: [
      "Everything in Starter",
      "5 user seats",
      "Unlimited Decision Lab scenarios",
      "Heartbeat check-ins (every 4 hours)",
      "Document uploads and parsing",
      "Integration connections (Google, Slack)",
      "Conversation history and search",
      "Priority email support",
    ],
    cta: "Get started",
    href: "/signup",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For larger organizations or networks with multiple entities and advanced needs.",
    highlight: false,
    features: [
      "Everything in Growth",
      "Unlimited user seats",
      "Custom archetype configurations",
      "Dedicated onboarding support",
      "API access for custom integrations",
      "Multi-org management",
      "SSO and advanced security",
      "Dedicated account support",
    ],
    cta: "Contact us",
    href: "/contact",
  },
];

const comparisonRows = [
  { feature: "All 6 AI directors", starter: true, growth: true, enterprise: true },
  { feature: "Bring your own API key (BYOK)", starter: true, growth: true, enterprise: true },
  { feature: "Org briefing and context memory", starter: true, growth: true, enterprise: true },
  { feature: "Team chat and task delegation", starter: true, growth: true, enterprise: true },
  { feature: "Decision Lab", starter: "10/month", growth: "Unlimited", enterprise: "Unlimited" },
  { feature: "Heartbeat frequency", starter: "Daily", growth: "Every 4 hours", enterprise: "Configurable" },
  { feature: "User seats", starter: "1", growth: "5", enterprise: "Unlimited" },
  { feature: "Document uploads", starter: false, growth: true, enterprise: true },
  { feature: "Integration connections", starter: false, growth: true, enterprise: true },
  { feature: "Multi-org management", starter: false, growth: false, enterprise: true },
  { feature: "Custom archetype configs", starter: false, growth: false, enterprise: true },
  { feature: "Support", starter: "Email", growth: "Priority email", enterprise: "Dedicated" },
];

export default function PricingPage() {
  return (
    <div className="bg-bg-0 min-h-screen">
      <SpialNavbar />

      {/* Hero */}
      <section className="bg-bg-plum-1 py-20">
        <div className="spial-container mx-auto text-center">
          <div className="eyebrow mb-4">Pricing</div>
          <h1 className="text-fg-1 text-[36px] md:text-[52px] font-semibold leading-[1.2] tracking-[-0.02em] mb-5">
            Transparent pricing. No surprises.
          </h1>
          <p className="text-fg-2 text-lg leading-[1.7] max-w-[600px] mx-auto">
            Bring your own API key. You only pay for the AI calls you make -- typically a few cents per conversation. Our platform fee covers the software, integrations, and your team&apos;s memory.
          </p>
        </div>
      </section>

      {/* BYOK callout */}
      <section className="py-10 bg-bg-0">
        <div className="spial-container mx-auto">
          <div className="bg-bg-2 shadow-elev-1 rounded-xl p-7 flex flex-col md:flex-row gap-6 items-center justify-between">
            <div>
              <h3 className="text-fg-1 text-lg font-semibold mb-2">The BYOK model: what it means for you</h3>
              <p className="text-fg-3 text-sm leading-[1.7] max-w-[600px]">
                You connect your own Claude API key from Anthropic. Every conversation, every Decision Lab run, every heartbeat check-in goes through your account. You see exactly what you&apos;re spending. We never markup API costs or take a cut. A typical day of active use costs around $1-3 in API fees.
              </p>
            </div>
            <a
              href="https://console.anthropic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="no-underline whitespace-nowrap"
            >
              <Button variant="secondary" size="md">
                Get an API key
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Tier cards */}
      <section className="py-20 bg-bg-1">
        <div className="spial-container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tiers.map((t) => (
              <div
                key={t.name}
                className={`rounded-2xl p-8 ${
                  t.highlight
                    ? "bg-bg-plum-1 shadow-elev-2 scale-105 border border-brand-500/30"
                    : "bg-bg-2 shadow-elev-1"
                }`}
              >
                {t.highlight && (
                  <div className="eyebrow mb-4">Most popular</div>
                )}
                <h2 className="text-2xl font-semibold text-fg-1 mb-2">{t.name}</h2>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-[48px] font-semibold text-brand-500">{t.price}</span>
                  <span className="text-sm text-fg-3">{t.period}</span>
                </div>
                <p className="text-sm text-fg-3 leading-[1.6] mb-6">{t.desc}</p>
                <Link href={t.href} className="block mb-8 no-underline">
                  <Button
                    variant={t.highlight ? "primary" : "secondary"}
                    size="md"
                    className="w-full justify-center"
                    trailingIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    {t.cta}
                  </Button>
                </Link>
                <ul className="list-none space-y-3">
                  {t.features.map((f, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-[1.5] text-fg-2">
                      <Check className="w-4 h-4 shrink-0 mt-0.5 text-brand-500" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-20 bg-bg-1">
        <div className="spial-container mx-auto">
          <h2 className="text-[28px] md:text-[34px] font-semibold tracking-[-0.01em] text-fg-1 mb-10 text-center">
            Full feature comparison
          </h2>
          <div className="bg-bg-2 shadow-elev-1 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bg-3">
                  <th className="text-left p-5 font-semibold text-fg-1">Feature</th>
                  <th className="text-center p-5 font-semibold text-fg-1">Starter</th>
                  <th className="text-center p-5 font-semibold text-brand-500 bg-brand-500/10">Growth</th>
                  <th className="text-center p-5 font-semibold text-fg-1">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr key={i} className={`border-b border-bg-3 ${i % 2 === 0 ? "bg-bg-2" : "bg-bg-1"}`}>
                    <td className="p-5 text-fg-2">{row.feature}</td>
                    <td className="p-5 text-center text-fg-2">
                      {typeof row.starter === "boolean" ? (
                        row.starter ? <Check className="w-4 h-4 text-brand-500 mx-auto" /> : <span className="text-fg-4">--</span>
                      ) : (
                        row.starter
                      )}
                    </td>
                    <td className="p-5 text-center text-fg-2 bg-brand-500/5">
                      {typeof row.growth === "boolean" ? (
                        row.growth ? <Check className="w-4 h-4 text-brand-500 mx-auto" /> : <span className="text-fg-4">--</span>
                      ) : (
                        row.growth
                      )}
                    </td>
                    <td className="p-5 text-center text-fg-2">
                      {typeof row.enterprise === "boolean" ? (
                        row.enterprise ? <Check className="w-4 h-4 text-brand-500 mx-auto" /> : <span className="text-fg-4">--</span>
                      ) : (
                        row.enterprise
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-bg-1">
        <div className="spial-container mx-auto">
          <h2 className="text-[28px] md:text-[34px] font-semibold tracking-[-0.01em] text-fg-1 mb-10 text-center">
            Pricing questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[900px] mx-auto">
            {[
              {
                q: "Do I need an API key to use Edify OS?",
                a: "Yes -- all AI interactions go through your own Anthropic API key. You sign up for free at console.anthropic.com. Most users spend less than $5/day in API costs even with heavy use.",
              },
              {
                q: "Is there a free trial?",
                a: "We are working on a free trial option. In the meantime, reach out and we will give you a hands-on demo of the full product before you commit.",
              },
              {
                q: "Can I change plans?",
                a: "Yes. Upgrade or downgrade at any time. Pricing is month-to-month with no long-term contracts unless you choose an annual plan for a discount.",
              },
              {
                q: "Are there discounts for nonprofits?",
                a: "Edify OS is built specifically for nonprofits, so the pricing is already designed with nonprofit budgets in mind. Reach out if you are working with a very small organization -- we have options.",
              },
            ].map((item, i) => (
              <div key={i} className="bg-bg-2 shadow-elev-1 p-7 rounded-xl">
                <h3 className="font-semibold text-fg-1 mb-3">{item.q}</h3>
                <p className="text-fg-3 text-sm leading-[1.7]">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-bg-0">
        <div className="spial-container mx-auto text-center">
          <h2 className="text-[28px] md:text-[34px] font-semibold tracking-[-0.01em] text-fg-1 mb-4">
            Still have questions?
          </h2>
          <p className="text-fg-3 leading-[1.7] max-w-[500px] mx-auto mb-8">
            Talk to us. We will walk you through the product, answer your pricing questions, and help you figure out if Edify OS is the right fit.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/contact" className="no-underline">
              <Button variant="primary" size="lg" trailingIcon={<ArrowRight className="w-4 h-4" />}>
                Contact us
              </Button>
            </Link>
            <Link href="/demo" className="no-underline">
              <Button variant="secondary" size="lg">
                See the demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SpialFooter />
    </div>
  );
}
