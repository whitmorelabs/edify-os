import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import SpialNavbar from "@/components/spial-navbar";
import SpialFooter from "@/components/spial-footer";
import { Button } from "@/components/ui";

export const metadata = {
  title: "Why AI Won't Replace Your Team. It'll Complete It. | Edify OS Blog",
  description: "Every nonprofit leader asks: is this going to take someone's job? The honest answer is no -- and here is why the fear itself points to something important.",
};

export default function ArticleAITeam() {
  return (
    <div className="bg-bg-0 min-h-screen">
      <SpialNavbar />

      <section className="bg-bg-plum-1 py-16">
        <div className="spial-container mx-auto">
          <Link href="/blog" className="inline-flex items-center gap-2 text-fg-3 no-underline text-sm hover:text-fg-1 transition-colors mb-8">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to blog
          </Link>
          <div className="eyebrow mb-4">AI for nonprofits</div>
          <h1 className="text-fg-1 text-[32px] md:text-[46px] font-semibold leading-[1.2] tracking-[-0.02em] mb-5 max-w-[750px]">
            Why AI won&apos;t replace your team. It&apos;ll complete it.
          </h1>
          <div className="flex items-center gap-4 text-fg-4 text-sm">
            <span>April 8, 2026</span>
            <span>--</span>
            <span>6 min read</span>
          </div>
        </div>
      </section>

      {/* Hero image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/blog/ai-wont-replace-your-team.jpg" alt="Diverse team collaborating around a table, sharing a high-five" className="w-full" style={{ maxHeight: 480, objectFit: "cover", display: "block" }} />

      <section className="py-16 bg-bg-1">
        <div className="spial-container mx-auto">
          <div className="max-w-[700px] mx-auto">
            <div className="prose prose-lg max-w-none">
              <p className="text-fg-2 leading-[1.8] text-lg mb-6">
                Every nonprofit leader we talk to asks the same question. Sometimes they ask it directly. Sometimes it lives underneath a dozen other questions about features and pricing. But it is always there.
              </p>
              <p className="text-fg-2 leading-[1.8] text-lg mb-6 font-medium">
                Is this going to take someone&apos;s job?
              </p>
              <p className="text-fg-2 leading-[1.8] mb-6">
                The honest answer is no. And the reason why is actually the core insight behind everything we have built.
              </p>

              <h2 className="text-[26px] font-semibold tracking-[-0.01em] text-fg-1 mt-10 mb-4">The jobs aren&apos;t getting taken. They&apos;re not being done.</h2>
              <p className="text-fg-2 leading-[1.8] mb-6">
                Here is the thing about nonprofit staffing: the roles that AI could theoretically replace are mostly roles that small and mid-size nonprofits cannot afford to fill in the first place. They do not have a development director whose job is at risk. They have an executive director who is also writing grants at midnight.
              </p>
              <p className="text-fg-2 leading-[1.8] mb-6">
                They do not have a communications manager whose position could be eliminated. They have a program coordinator who also runs the Instagram account in between site visits.
              </p>
              <p className="text-fg-2 leading-[1.8] mb-6">
                The concern about AI replacing nonprofit jobs assumes those jobs exist to be replaced. For most nonprofits in the country -- organizations running on two or three staff -- those positions are aspirational. They are the team members they need but cannot fund.
              </p>

              <h2 className="text-[26px] font-semibold tracking-[-0.01em] text-fg-1 mt-10 mb-4">Why the fear makes sense anyway</h2>
              <p className="text-fg-2 leading-[1.8] mb-6">
                The fear is not irrational. The nonprofit sector has watched other sectors lose jobs to automation. Legitimate questions about AI and labor deserve serious engagement, not dismissal.
              </p>
              <p className="text-fg-2 leading-[1.8] mb-6">
                But there is a meaningful distinction between AI replacing work that humans are currently paid to do and AI filling gaps in capacity that organizations could never afford to staff. The second one is not displacement. It is access.
              </p>
              <p className="text-fg-2 leading-[1.8] mb-6">
                A food pantry in rural South Carolina should have the same operational capacity as a large urban nonprofit with a full development team. Right now, it does not. The question is whether that gap is fixed or inevitable.
              </p>

              <h2 className="text-[26px] font-semibold tracking-[-0.01em] text-fg-1 mt-10 mb-4">What completion actually looks like</h2>
              <p className="text-fg-2 leading-[1.8] mb-6">
                The nonprofits that use Edify OS effectively are not replacing staff. They are freeing them.
              </p>
              <p className="text-fg-2 leading-[1.8] mb-6">
                The executive director who was spending 30% of their time on grant research is now spending that time on program development and community relationships -- the work that actually requires a human who knows the community.
              </p>
              <p className="text-fg-2 leading-[1.8] mb-6">
                The development manager who was manually updating a donor spreadsheet after every event now has that time back to have real conversations with major donors. The relationship work. The cultivation. The stuff that cannot be automated because it requires genuine human connection.
              </p>
              <p className="text-fg-2 leading-[1.8] mb-6">
                That is completion. Not replacement.
              </p>

              <h2 className="text-[26px] font-semibold tracking-[-0.01em] text-fg-1 mt-10 mb-4">The real risk</h2>
              <p className="text-fg-2 leading-[1.8] mb-6">
                The risk we worry about is the opposite of job loss. It is nonprofits being so cautious about AI that they continue to operate at a structural disadvantage relative to better-resourced organizations.
              </p>
              <p className="text-fg-2 leading-[1.8] mb-6">
                The organizations that are embracing AI tools thoughtfully are not downsizing. They are doing more. More grant applications. More donor touchpoints. More program evaluation. More community engagement. They are not replacing the humans on their team. They are finally giving those humans backup.
              </p>
              <p className="text-fg-2 leading-[1.8] mb-6">
                That is the version of AI we are trying to build toward. Not automation as a cost-cutting tool. AI as the great equalizer -- the thing that finally lets a two-person nonprofit operate like they have a full leadership team.
              </p>

              <div className="bg-bg-2 shadow-elev-1 rounded-xl p-8 mt-10">
                <h3 className="text-lg font-semibold text-brand-500 mb-3">Ready to meet your team?</h3>
                <p className="text-fg-3 text-sm leading-[1.7] mb-5">
                  Six AI directors built specifically for nonprofits. Brief them on your mission and see what happens when every department has coverage.
                </p>
                <Link href="/signup" className="no-underline inline-flex">
                  <Button variant="primary" size="md" trailingIcon={<ArrowRight className="w-4 h-4" />}>
                    Get started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SpialFooter />
    </div>
  );
}
