"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import SpialNavbar from "@/components/spial-navbar";
import SpialFooter from "@/components/spial-footer";
import { Button } from "@/components/ui";

// Reveal animation: fade in + slide up + subtle scale on scroll-into-view
const revealVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

// Reduced-motion fallback: instant fade-in, no slide or scale
const revealVariantsReduced = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.01 } },
};

interface AnimatedScreenshotProps {
  src: string;
  alt: string;
  /** Pixel distance the image pans downward over the duration (creates "scroll-through" feel). */
  panDistance?: number;
  /** Pan cycle duration in seconds. */
  panDuration?: number;
}

function AnimatedScreenshot({
  src,
  alt,
  panDistance = 100,
  panDuration = 8,
}: AnimatedScreenshotProps) {
  const reduced = useReducedMotion();
  const variants = reduced ? revealVariantsReduced : revealVariants;

  return (
    <motion.div
      className="rounded-xl overflow-hidden border border-line-1 shadow-elev-2"
      // Wrapper clips the image to a shorter window so the pan reveals content below
      style={{ aspectRatio: "16 / 9", position: "relative" }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={variants}
    >
      <motion.img
        src={src}
        alt={alt}
        className="w-full block"
        style={{ display: "block" }}
        // Continuous vertical pan — creates the "user is scrolling through the dashboard" feel
        animate={reduced ? undefined : { y: [0, -panDistance, 0] }}
        transition={
          reduced
            ? undefined
            : {
                duration: panDuration,
                repeat: Infinity,
                ease: "easeInOut",
              }
        }
      />
    </motion.div>
  );
}

export default function DemoPage() {
  return (
    <div className="bg-bg-0 min-h-screen">
      <SpialNavbar />

      {/* Hero */}
      <section className="bg-bg-plum-1 py-20">
        <div className="spial-container mx-auto text-center">
          <div className="eyebrow mb-4">Product demo</div>
          <h1 className="text-fg-1 text-[36px] md:text-[52px] font-semibold leading-[1.2] tracking-[-0.02em] mb-5">
            See what it looks like when your team shows up.
          </h1>
          <p className="text-fg-2 text-lg leading-[1.7] max-w-[700px] mx-auto">
            A guided walkthrough of the Edify OS portal. Five minutes, five features, and a clear picture of what changes when your operational gaps are covered.
          </p>
        </div>
      </section>

      {/* Section 1: Dashboard */}
      <section className="py-20 bg-bg-1">
        <div className="spial-container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[60px] items-center">
            <div>
              <div className="eyebrow mb-3">Step 1</div>
              <h2 className="text-[28px] md:text-[34px] font-semibold tracking-[-0.01em] text-fg-1 mb-5">
                Your team at a glance.
              </h2>
              <p className="leading-[1.7] text-fg-2 mb-4">
                The dashboard shows you all six directors, their recent activity, and any heartbeat updates they have surfaced. You can see at a glance what each team member has been working on and where something needs your attention.
              </p>
              <p className="leading-[1.7] text-fg-2">
                The inbox lives here too -- every proactive check-in, every flagged deadline, every recommendation from your team waiting for your review.
              </p>
            </div>
            <AnimatedScreenshot
              src="/demo/dashboard-overview.jpg"
              alt="Dashboard overview showing all six director cards and the heartbeat inbox"
              panDistance={100}
              panDuration={9}
            />
          </div>
        </div>
      </section>

      {/* Section 2: Team Chat */}
      <section className="py-20 bg-bg-1">
        <div className="spial-container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[60px] items-center">
            <AnimatedScreenshot
              src="/demo/team-chat-dev-director.jpg"
              alt="Team chat with the Development Director showing suggested prompts"
              panDistance={120}
              panDuration={8}
            />
            <div>
              <div className="eyebrow mb-3">Step 2</div>
              <h2 className="text-[28px] md:text-[34px] font-semibold tracking-[-0.01em] text-fg-1 mb-5">
                Ask your team anything.
              </h2>
              <p className="leading-[1.7] text-fg-2 mb-4">
                Select a team member and start a conversation. Each director responds in their own voice. The Development Director gives you ranked options with dollar amounts and deadlines. The Marketing Director leads with the angle. The Programs Director brings the participant perspective before anything else.
              </p>
              <p className="leading-[1.7] text-fg-2">
                Conversations are saved so context carries forward. Your team remembers what they have already told you and builds on it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Decision Lab */}
      <section className="py-20 bg-bg-1">
        <div className="spial-container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[60px] items-center">
            <div>
              <div className="eyebrow mb-3">Step 3</div>
              <h2 className="text-[28px] md:text-[34px] font-semibold tracking-[-0.01em] text-fg-1 mb-5">
                6 perspectives. One decision.
              </h2>
              <p className="leading-[1.7] text-fg-2 mb-4">
                The Decision Lab is where you run any major decision, scenario, or draft past the full team at once. Type in a question -- "Should we cancel our annual gala?" or "Review this donor email before I send it" -- and every director weighs in simultaneously.
              </p>
              <p className="leading-[1.7] text-fg-2 mb-4">
                Each response shows their stance (supportive, cautious, or opposing), their reasoning, and their specific recommendation. The synthesis panel summarizes where the team agrees, where they disagree, and what to do next.
              </p>
              <p className="leading-[1.7] text-fg-3 text-sm">
                All 6 responses arrive in under 10 seconds.
              </p>
            </div>
            <AnimatedScreenshot
              src="/demo/decision-lab.jpg"
              alt="Decision Lab page showing example scenarios and six director perspectives"
              panDistance={80}
              panDuration={10}
            />
          </div>
        </div>
      </section>

      {/* Section 4: Heartbeats */}
      <section className="py-20 bg-bg-1">
        <div className="spial-container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[60px] items-center">
            <AnimatedScreenshot
              src="/demo/heartbeat-inbox.jpg"
              alt="Heartbeat inbox page showing proactive director check-ins"
              panDistance={90}
              panDuration={9}
            />
            <div>
              <div className="eyebrow mb-3">Step 4</div>
              <h2 className="text-[28px] md:text-[34px] font-semibold tracking-[-0.01em] text-fg-1 mb-5">
                Your team checks in proactively.
              </h2>
              <p className="leading-[1.7] text-fg-2 mb-4">
                Every few hours, your directors scan their domains and surface what matters. Grant deadlines. Donor engagement gaps. Budget variances. Campaign performance. Upcoming event milestones.
              </p>
              <p className="leading-[1.7] text-fg-2 mb-4">
                Each heartbeat arrives with a summary, why it matters, and a suggested action. You can respond to start a deeper conversation with that director, or dismiss if it is not relevant right now.
              </p>
              <p className="leading-[1.7] text-fg-3 text-sm">
                Directors only check in when they have something worth saying. No noise.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Org Briefing */}
      <section className="py-20 bg-bg-1">
        <div className="spial-container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[60px] items-center">
            <div>
              <div className="eyebrow mb-3">Step 5</div>
              <h2 className="text-[28px] md:text-[34px] font-semibold tracking-[-0.01em] text-fg-1 mb-5">
                Get started in 5 minutes.
              </h2>
              <p className="leading-[1.7] text-fg-2 mb-4">
                The org briefing is how you onboard your team. It walks through four steps: your mission, your programs, your brand voice, and any documents you want your team to know about.
              </p>
              <p className="leading-[1.7] text-fg-2 mb-4">
                This context gets injected into every conversation, every heartbeat, every Decision Lab response. Your team knows your org before the first conversation starts.
              </p>
              <p className="leading-[1.7] text-fg-3 text-sm">
                The more context you give, the more specific and useful every response becomes.
              </p>
            </div>
            <AnimatedScreenshot
              src="/demo/org-briefing.jpg"
              alt="Org briefing page with four-step onboarding flow"
              panDistance={80}
              panDuration={7}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-bg-0">
        <div className="spial-container mx-auto text-center">
          <h2 className="text-[28px] md:text-[34px] font-semibold tracking-[-0.01em] text-fg-1 mb-4">
            Ready to meet your team?
          </h2>
          <p className="text-fg-3 leading-[1.7] max-w-[500px] mx-auto mb-8">
            Brief them on your mission. Let them handle the operational layer. Start leading.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/signup" className="no-underline">
              <Button variant="primary" size="lg" trailingIcon={<ArrowRight className="w-4 h-4" />}>
                Get started
              </Button>
            </Link>
            <Link href="/contact" className="no-underline">
              <Button variant="secondary" size="lg">
                Talk to us first
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SpialFooter />
    </div>
  );
}
