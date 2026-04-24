import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import SpialNavbar from "@/components/spial-navbar";
import SpialFooter from "@/components/spial-footer";
import { Button, Card, CardHeader, CardBody, CardFooter, Badge } from "@/components/ui";

export const metadata = {
  title: "Pricing | Edify OS",
  description:
    "Four plans for every nonprofit — from free to enterprise. Start for free, scale as you grow. No hidden fees, no per-seat surprises.",
};

const freeFeatures = [
  "1 AI director",
  "10 conversations/month",
  "Basic org memory",
  "Community support",
];

const starterFeatures = [
  "3 AI directors",
  "100 conversations/month",
  "Full org memory",
  "Email support",
  "Google Calendar integration",
];

const proFeatures = [
  "All 6 AI directors",
  "Unlimited conversations",
  "Full org memory + auto-save",
  "Priority support",
  "All integrations (Calendar, Drive, Gmail)",
  "Heartbeat proactive check-ins",
  "Decision Lab",
];

const enterpriseFeatures = [
  "Everything in Pro",
  "Custom integrations",
  "Dedicated support",
  "Multi-org management",
  "Custom AI training",
  "SLA guarantees",
];

const faqItems = [
  {
    q: "Do I need an API key to use Edify OS?",
    a: "Yes — all AI interactions go through your own Anthropic API key. You sign up for free at console.anthropic.com. Most organizations spend less than $5/day in API costs even with heavy use.",
  },
  {
    q: "Can I upgrade or downgrade my plan?",
    a: "Yes. You can change your plan at any time from your account settings. Upgrades take effect immediately. Downgrades apply at the start of your next billing cycle.",
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
      <section
        className="relative overflow-hidden py-28"
        style={{ background: "var(--hero-gradient-marketing), var(--bg-plum-1)" }}
      >
        <div className="spial-container mx-auto text-center relative z-10">
          <div className="eyebrow mb-4">Pricing</div>
          <h1 className="text-fg-1 text-[36px] md:text-[52px] font-semibold leading-[1.2] tracking-[-0.02em] mb-6">
            Simple pricing for every nonprofit.
          </h1>
          <p className="text-fg-2 text-lg leading-[1.75] max-w-[640px] mx-auto">
            Start free, scale as you grow. From a single AI director to a full team — pick the plan that fits your organization.
          </p>
        </div>
      </section>

      {/* Four-card grid */}
      <section className="py-28 bg-bg-1">
        <div className="spial-container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-[1280px] mx-auto">

            {/* Card 1 — Free */}
            <Card elevation={1} className="flex flex-col">
              <CardHeader className="pb-0">
                <Badge tone="neutral" eyebrow className="mb-4">
                  Free
                </Badge>
                <h2 className="text-2xl font-semibold text-fg-1 mb-1">Free</h2>
                <p className="text-xs text-fg-3 mb-4">Try Edify OS</p>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-[44px] font-semibold leading-none text-fg-1">$0</span>
                  <span className="text-sm text-fg-2 ml-1">/month</span>
                </div>
                <p className="text-sm text-fg-3 leading-[1.6]">
                  Try Edify OS with limited features. No credit card required.
                </p>
              </CardHeader>

              <CardBody className="flex-1 pt-6">
                <ul className="list-none space-y-3">
                  {freeFeatures.map((feature, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-[1.5] text-fg-2">
                      <Check className="w-4 h-4 shrink-0 mt-0.5 text-fg-3" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardBody>

              <CardFooter>
                <Link href="/signup" className="block w-full no-underline">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full justify-center"
                  >
                    Get started
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Card 2 — Starter */}
            <Card elevation={1} className="flex flex-col">
              <CardHeader className="pb-0">
                <Badge tone="neutral" eyebrow className="mb-4">
                  Starter
                </Badge>
                <h2 className="text-2xl font-semibold text-fg-1 mb-1">Starter</h2>
                <p className="text-xs text-fg-3 mb-4">For small nonprofits</p>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-[44px] font-semibold leading-none text-fg-1">$49</span>
                  <span className="text-sm text-fg-2 ml-1">/month</span>
                </div>
                <p className="text-sm text-fg-3 leading-[1.6]">
                  For small nonprofits getting started with AI.
                </p>
              </CardHeader>

              <CardBody className="flex-1 pt-6">
                <ul className="list-none space-y-3">
                  {starterFeatures.map((feature, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-[1.5] text-fg-2">
                      <Check className="w-4 h-4 shrink-0 mt-0.5 text-fg-3" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardBody>

              <CardFooter>
                <Link href="/signup" className="block w-full no-underline">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full justify-center"
                  >
                    Start free trial
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Card 3 — Pro (highlighted) */}
            <Card
              elevation={2}
              className="flex flex-col border-t-[3px] border-t-brand-500 relative"
            >
              <CardHeader className="pb-0">
                <Badge tone="brand" eyebrow className="mb-4">
                  Recommended
                </Badge>
                <h2 className="text-2xl font-semibold text-fg-1 mb-1">Pro</h2>
                <p className="text-xs text-fg-3 mb-4">For growing nonprofits</p>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-[44px] font-semibold leading-none text-fg-1">$149</span>
                  <span className="text-sm text-fg-2 ml-1">/month</span>
                </div>
                <p className="text-sm text-fg-3 leading-[1.6]">
                  The full Edify OS experience. Every director, every integration.
                </p>
              </CardHeader>

              <CardBody className="flex-1 pt-6">
                <ul className="list-none space-y-3">
                  {proFeatures.map((feature, i) => (
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
                    Start free trial
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Card 4 — Enterprise */}
            <Card elevation={1} className="flex flex-col">
              <CardHeader className="pb-0">
                <Badge tone="neutral" eyebrow className="mb-4">
                  Enterprise
                </Badge>
                <h2 className="text-2xl font-semibold text-fg-1 mb-1">Enterprise</h2>
                <p className="text-xs text-fg-3 mb-4">Large nonprofits &amp; networks</p>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-[36px] font-semibold leading-none text-fg-2">
                    Custom
                  </span>
                </div>
                <p className="text-sm text-fg-3 leading-[1.6]">
                  For large nonprofits, multi-org networks, or custom integrations.
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
                    Contact us
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
