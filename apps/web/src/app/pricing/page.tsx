import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import SpialNavbar from "@/components/spial-navbar";
import SpialFooter from "@/components/spial-footer";
import { Button, Card, CardHeader, CardBody, CardFooter, Badge } from "@/components/ui";

export const metadata = {
  title: "Pricing | Edify OS",
  description:
    "One plan, everything included. $249/month per organization — no hidden fees, no per-seat surprises.",
};

const edifyFeatures = [
  "All 6 AI directors (Executive Assistant, Development Director, Marketing Director, Events Director, Programs Director, HR & Volunteer Coordinator)",
  "Unlimited conversations with your team",
  "Google Workspace integration (Calendar, Gmail, Drive)",
  "Grant discovery (Grants.gov + SAM.gov)",
  "Donor CRM",
  "Social publishing (Instagram, Facebook, LinkedIn, YouTube)",
  "Document generation (docx, xlsx, pptx, pdf)",
  "Bring your own Claude API key (BYOK — you pay Anthropic directly)",
  "Priority email support",
];

const enterpriseFeatures = [
  "Everything in Edify OS, plus:",
  "Multi-organization accounts",
  "Dedicated account manager",
  "Custom integrations (Salesforce, Raiser's Edge, custom APIs)",
  "SSO / SAML",
  "Advanced audit logs and compliance support",
  "SLA-backed uptime",
];

const faqItems = [
  {
    q: "Do I need an API key to use Edify OS?",
    a: "Yes — all AI interactions go through your own Anthropic API key. You sign up for free at console.anthropic.com. Most organizations spend less than $5/day in API costs even with heavy use.",
  },
  {
    q: "Is there a free trial?",
    a: "We are working on a free trial option. In the meantime, reach out and we will give you a hands-on demo of the full product before you commit.",
  },
  {
    q: "What does BYOK mean?",
    a: "Bring Your Own Key. You connect your own Claude API key from Anthropic. Every conversation, every task, every heartbeat check-in goes through your account — you see exactly what you are spending. We never mark up API costs or take a cut.",
  },
  {
    q: "Are there discounts for nonprofits?",
    a: "Edify OS is built specifically for nonprofits, so the pricing is already designed with nonprofit budgets in mind. Reach out if you are working with a very small organization — we have options.",
  },
];

export default function PricingPage() {
  return (
    <div className="bg-bg-0 min-h-screen">
      <SpialNavbar />

      {/* Section header */}
      <section className="bg-bg-plum-1 py-28">
        <div className="spial-container mx-auto text-center">
          <div className="eyebrow mb-4">Pricing</div>
          <h1 className="text-fg-1 text-[36px] md:text-[52px] font-semibold leading-[1.2] tracking-[-0.02em] mb-6">
            Simple pricing for every nonprofit.
          </h1>
          <p className="text-fg-2 text-lg leading-[1.75] max-w-[600px] mx-auto">
            One plan, everything included. No hidden fees, no per-seat surprises.
          </p>
        </div>
      </section>

      {/* Two-card grid */}
      <section className="py-28 bg-bg-1">
        <div className="spial-container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-[960px] mx-auto">

            {/* Card 1 — Edify OS (primary) */}
            <Card
              elevation={2}
              className="flex flex-col border-t-[3px] border-t-brand-500 relative"
            >
              <CardHeader className="pb-0">
                <Badge tone="brand" eyebrow className="mb-4">
                  Recommended
                </Badge>
                <h2 className="text-2xl font-semibold text-fg-1 mb-1">Edify OS</h2>
                <p className="text-xs text-fg-3 mb-4">Per organization</p>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-[52px] font-semibold leading-none text-fg-1">$249</span>
                  <span className="text-sm text-fg-2 ml-1">/month</span>
                </div>
                <p className="text-sm text-fg-3 leading-[1.6]">
                  Everything you need to run your nonprofit, powered by AI.
                </p>
              </CardHeader>

              <CardBody className="flex-1 pt-6">
                <ul className="list-none space-y-3">
                  {edifyFeatures.map((feature, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-[1.5] text-fg-2">
                      <Check className="w-4 h-4 shrink-0 mt-0.5 text-brand-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardBody>

              <CardFooter>
                <Link href="/signup" className="block w-full no-underline">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full justify-center"
                    trailingIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Start with Edify OS
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Card 2 — Enterprise (secondary) */}
            <Card elevation={1} className="flex flex-col">
              <CardHeader className="pb-0">
                <Badge tone="neutral" eyebrow className="mb-4">
                  Enterprise
                </Badge>
                <h2 className="text-2xl font-semibold text-fg-1 mb-1">Custom</h2>
                <p className="text-xs text-fg-3 mb-4">&nbsp;</p>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-[40px] font-semibold leading-none text-fg-2">
                    Let&apos;s talk
                  </span>
                </div>
                <p className="text-sm text-fg-3 leading-[1.6]">
                  For larger nonprofits, multi-org networks, or custom integrations.
                </p>
              </CardHeader>

              <CardBody className="flex-1 pt-6">
                <ul className="list-none space-y-3">
                  {enterpriseFeatures.map((feature, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-[1.5] text-fg-2">
                      <Check className="w-4 h-4 shrink-0 mt-0.5 text-fg-3" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardBody>

              <CardFooter>
                <a
                  href="mailto:connect@edifyanother.com"
                  className="block w-full no-underline"
                >
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full justify-center"
                  >
                    Contact sales
                  </Button>
                </a>
              </CardFooter>
            </Card>

          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-28 bg-bg-0">
        <div className="spial-container mx-auto">
          <h2 className="text-[28px] md:text-[34px] font-semibold tracking-[-0.01em] text-fg-1 mb-12 text-center">
            Pricing questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-[900px] mx-auto">
            {faqItems.map((item, i) => (
              <Card key={i} elevation={1} className="p-7">
                <h3 className="font-semibold text-fg-1 mb-3">{item.q}</h3>
                <p className="text-fg-3 text-sm leading-[1.7]">{item.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-28 bg-bg-1">
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
