import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import SpialNavbar from "@/components/spial-navbar";
import SpialFooter from "@/components/spial-footer";
import { Button } from "@/components/ui";

export const metadata = {
  title: "The Grant Research Problem Nobody Talks About | Edify OS Blog",
  description: "Everyone knows grant writing is hard. But the thing that kills most grant programs isn't the writing -- it's the research that never happens.",
};

export default function ArticleGrantResearch() {
  return (
    <div className="bg-bg-0 min-h-screen">
      <SpialNavbar />

      <section className="bg-bg-plum-1 py-16">
        <div className="spial-container mx-auto">
          <Link href="/blog" className="inline-flex items-center gap-2 text-fg-3 no-underline text-sm hover:text-fg-1 transition-colors mb-8">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to blog
          </Link>
          <div className="eyebrow mb-4">Fundraising</div>
          <h1 className="text-fg-1 text-[32px] md:text-[46px] font-semibold leading-[1.2] tracking-[-0.02em] mb-5 max-w-[750px]">
            The grant research problem nobody talks about
          </h1>
          <div className="flex items-center gap-4 text-fg-4 text-sm">
            <span>April 1, 2026</span>
            <span>--</span>
            <span>5 min read</span>
          </div>
        </div>
      </section>

      <section className="py-16 bg-bg-1">
        <div className="spial-container mx-auto">
          <div className="max-w-[700px] mx-auto">
            <p className="text-fg-2 leading-[1.8] text-lg mb-6">
              Everyone in the nonprofit sector talks about how hard grant writing is. The 40-page applications. The obscure formatting requirements. The budget narratives that need to reconcile with the program narrative that needs to reconcile with the evaluation plan.
            </p>
            <p className="text-fg-2 leading-[1.8] mb-6">
              All of that is real. But it is not the thing that actually kills most grant programs.
            </p>
            <p className="text-fg-2 leading-[1.8] mb-6 font-medium">
              The thing that kills most grant programs is the research that never happens.
            </p>

            <h2 className="text-[26px] font-semibold tracking-[-0.01em] text-fg-1 mt-10 mb-4">The math problem at the beginning</h2>
            <p className="text-fg-2 leading-[1.8] mb-6">
              Most development directors will tell you that they spend more time writing grants than researching them. That ratio is backwards.
            </p>
            <p className="text-fg-2 leading-[1.8] mb-6">
              A well-researched grant opportunity has a dramatically higher success rate than a poorly matched one. Writing a 40-page application to a funder whose priorities do not align with your programs is a 40-hour exercise that ends in a form rejection. But it feels like work. It produces output. It is visible in a way that research is not.
            </p>
            <p className="text-fg-2 leading-[1.8] mb-6">
              Research is the invisible work. Reading funder profiles. Tracking which foundations funded organizations like yours and which ones did not. Noticing that a foundation recently shifted its focus from workforce development to early childhood -- which means your application is no longer competitive, even if it was last year.
            </p>

            <h2 className="text-[26px] font-semibold tracking-[-0.01em] text-fg-1 mt-10 mb-4">The pipeline problem</h2>
            <p className="text-fg-2 leading-[1.8] mb-6">
              Sustainable grant funding requires a pipeline. Not one application at a time, scrambled together before a deadline. A managed portfolio of relationships, applications at different stages, and a forward-looking horizon of upcoming opportunities.
            </p>
            <p className="text-fg-2 leading-[1.8] mb-6">
              Building that pipeline requires time most development staff do not have. A one-person development team at a small nonprofit is also usually managing donor relations, running campaigns, supporting the board, and doing event planning. Grant research -- the deep, systematic kind -- gets squeezed to whatever is left.
            </p>
            <p className="text-fg-2 leading-[1.8] mb-6">
              What gets left is usually reactive research: someone mentions a funder, you look them up. A deadline comes up in your email, you scramble. The pipeline never gets built because there is no time to build it.
            </p>

            <h2 className="text-[26px] font-semibold tracking-[-0.01em] text-fg-1 mt-10 mb-4">What happens when research gets done</h2>
            <p className="text-fg-2 leading-[1.8] mb-6">
              When nonprofits actually invest in grant research -- matching their programs to funders systematically, tracking foundation priorities over time, building relationships before the application opens -- their success rates go up significantly.
            </p>
            <p className="text-fg-2 leading-[1.8] mb-6">
              The development directors who do this well are not smarter than the ones who do not. They have more time, more staff, or better tools. The research capacity correlates with organizational budget in a pretty linear way.
            </p>
            <p className="text-fg-2 leading-[1.8] mb-6">
              That is the problem we built the Development Director to solve. Not just helping with the writing -- though it does that too. Starting upstream, where the real leverage is. Researching opportunities, ranking them by mission fit and feasibility, flagging deadlines before they become emergencies, and maintaining a living picture of what is in the pipeline.
            </p>

            <div className="bg-bg-2 shadow-elev-1 rounded-xl p-7 my-10">
              <p className="text-fg-3 text-sm leading-[1.8] italic">
                &ldquo;Found 3 grant opportunities matching your mission. The Community Foundation deadline is in 9 days and your LOI was already approved -- this one is the priority. The Morrison Family Foundation opens in 6 weeks and your youth literacy program is a strong fit. I&apos;d rank it a 7/10 on fundability. Want me to start the LOI for the Community Foundation today?&rdquo;
              </p>
              <p className="text-fg-4 text-xs mt-3">-- Development Director, proactive heartbeat</p>
            </div>

            <p className="text-fg-2 leading-[1.8] mb-6">
              That kind of proactive scanning -- happening every few hours, not just when you remember to ask -- is what a well-resourced development department does continuously. It is the research capacity that most organizations cannot afford to staff. But it does not have to be unaffordable.
            </p>

            <div className="bg-bg-2 shadow-elev-1 rounded-xl p-8 mt-10">
              <h3 className="text-lg font-semibold text-brand-500 mb-3">Meet your Development Director</h3>
              <p className="text-fg-3 text-sm leading-[1.7] mb-5">
                Data-driven. Deadline-aware. Always working the pipeline.
              </p>
              <Link href="/agents/development-director" className="no-underline inline-flex">
                <Button variant="primary" size="md" trailingIcon={<ArrowRight className="w-4 h-4" />}>
                  Learn more
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SpialFooter />
    </div>
  );
}
