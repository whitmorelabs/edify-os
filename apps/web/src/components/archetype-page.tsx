import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import SpialNavbar from "@/components/spial-navbar";
import SpialFooter from "@/components/spial-footer";
import Placeholder from "@/components/placeholder";
import { Button } from "@/components/ui";

/* ── Data shape ─────────────────────────────────────────────── */
export interface ArchetypeData {
  name: string;
  role: string;
  personality: string;
  coreQuestion: string;
  responseStyle: string;
  responsibilities: string[];
  subagents: { name: string; description: string }[];
  tools: { name: string; params: string; description: string }[];
  scenarios: { title: string; description: string }[];
  /** Optional hero image shown in the Responsibilities section. */
  image?: string;
}

/* ── Component ──────────────────────────────────────────────── */
export default function ArchetypePage({
  archetype,
  heroIcon: HeroIcon,
}: {
  archetype: ArchetypeData;
  heroIcon: LucideIcon;
}) {
  const subagentCols =
    archetype.subagents.length >= 5 ? "md:grid-cols-3" : "md:grid-cols-2";

  return (
    <div className="bg-bg-0 min-h-screen">
      <SpialNavbar />

      {/* Hero */}
      <section className="bg-bg-plum-1 py-20 md:py-24 relative overflow-hidden">
        <div className="spial-container relative z-[1]">
          <div className="flex flex-col items-center text-center">
            <HeroIcon className="w-16 h-16 text-brand-500 mb-6" />
            <h1 className="text-fg-1 text-[36px] md:text-[52px] font-semibold leading-[1.2] tracking-[-0.02em] mb-5">
              {archetype.name}
            </h1>
            <p className="text-fg-2 text-lg mb-4 max-w-[600px] leading-[1.7]">
              {archetype.role}
            </p>
            <p className="text-fg-3 text-base italic max-w-[500px] mb-8">
              &ldquo;{archetype.personality}&rdquo;
            </p>
            <Link href="/signup" className="no-underline">
              <Button variant="primary" size="lg" trailingIcon={<ArrowRight className="w-4 h-4" />}>
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Responsibilities */}
      <section className="py-20 bg-bg-1">
        <div className="spial-container">
          <div className="eyebrow mb-4">Responsibilities</div>
          <h2 className="text-[28px] md:text-[34px] font-semibold tracking-[-0.01em] text-fg-1 mb-5">
            What {archetype.name} does
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[60px] items-center mt-10">
            <div>
              <ul className="list-none">
                {archetype.responsibilities.map((r, i) => (
                  <li
                    key={i}
                    className="flex gap-4 mb-4 text-fg-2 text-base before:content-['\2713'] before:text-brand-500 before:font-bold before:text-lg before:shrink-0"
                  >
                    {r}
                  </li>
                ))}
              </ul>
              <Link
                href="#"
                className="text-brand-500 no-underline font-semibold inline-flex items-center gap-2 mt-5 transition-colors duration-300 hover:opacity-70"
              >
                Explore more
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <Placeholder className="w-full aspect-[4/3]" label={archetype.name} src={archetype.image} />
          </div>
        </div>
      </section>

      {/* Subagents */}
      <section className="py-20 bg-bg-1">
        <div className="spial-container">
          <div className="eyebrow mb-4">Subagents</div>
          <h2 className="text-[28px] md:text-[34px] font-semibold tracking-[-0.01em] text-fg-1 mb-10">
            The team behind the {archetype.name}
          </h2>
          <div className={`grid grid-cols-1 ${subagentCols} gap-[30px]`}>
            {archetype.subagents.map((s, i) => (
              <div
                key={i}
                className="bg-bg-2 shadow-elev-1 rounded-xl p-[30px]"
              >
                <h3 className="text-xl font-semibold text-fg-1 mb-3">{s.name}</h3>
                <p className="text-[15px] text-fg-3 leading-[1.6]">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools */}
      <section className="py-20 bg-bg-0">
        <div className="spial-container">
          <h2 className="text-[28px] md:text-[34px] font-semibold tracking-[-0.01em] text-fg-1 mb-10 text-center">
            Specialized tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[30px]">
            {archetype.tools.map((t, i) => (
              <div
                key={i}
                className="bg-bg-2 shadow-elev-1 rounded-xl p-[30px]"
              >
                <h3 className="text-lg font-semibold text-brand-500 mb-2 font-mono">
                  {t.name}
                </h3>
                <p className="text-fg-4 text-sm mb-3 font-mono">
                  ({t.params})
                </p>
                <p className="text-fg-2 text-[15px] leading-[1.6]">{t.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-bg-1">
        <div className="spial-container">
          <div className="eyebrow mb-4">Use cases</div>
          <h2 className="text-[28px] md:text-[34px] font-semibold tracking-[-0.01em] text-fg-1 mb-5">
            See {archetype.name} in action
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[30px] mt-[50px]">
            {archetype.scenarios.map((s, i) => (
              <div
                key={i}
                className="bg-bg-2 shadow-elev-1 rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-elev-2"
              >
                <div className="w-full h-[180px] bg-bg-3" />
                <div className="p-[25px]">
                  <div className="eyebrow mb-2.5">
                    Scenario {i + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-fg-1 mb-2.5">{s.title}</h3>
                  <p className="text-[14px] text-fg-3 leading-[1.6]">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-[60px] bg-bg-0">
        <div className="spial-container flex flex-col items-center">
          <h2 className="text-[28px] md:text-[42px] font-semibold tracking-[-0.02em] text-fg-1 max-w-[600px] mx-auto mb-10 leading-[1.3]">
            Ready to hire your {archetype.name}?
          </h2>
          <Link href="/signup" className="no-underline">
            <Button variant="primary" size="lg" trailingIcon={<ArrowRight className="w-4 h-4" />}>
              Get started
            </Button>
          </Link>
        </div>
      </section>

      <SpialFooter />
    </div>
  );
}
