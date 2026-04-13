import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import SpialNavbar from "@/components/spial-navbar";
import SpialFooter from "@/components/spial-footer";

export const metadata = {
  title: "From Drowning in Admin to Leading with Vision | Edify OS Blog",
  description: "There is a particular kind of exhaustion that nonprofit leaders know. It is not from working too hard. It is from working on the wrong things for too long.",
};

export default function ArticleFromDrowningToLeading() {
  return (
    <div className="spial-page">
      <SpialNavbar />

      <section className="bg-[#1a2b32] py-16">
        <div className="spial-container mx-auto">
          <Link href="/blog" className="inline-flex items-center gap-2 text-white/60 no-underline text-sm hover:text-white transition-colors mb-8">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Blog
          </Link>
          <div className="text-xs text-[#8B5CF6] font-semibold uppercase mb-4">Leadership</div>
          <h1 className="text-white text-[32px] md:text-[46px] font-semibold leading-[1.2] mb-5 max-w-[750px]">
            From Drowning in Admin to Leading with Vision
          </h1>
          <div className="flex items-center gap-4 text-white/50 text-sm">
            <span>March 18, 2026</span>
            <span>--</span>
            <span>8 min read</span>
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#f7f6f5]">
        <div className="spial-container mx-auto">
          <div className="max-w-[700px] mx-auto">
            <p className="text-[#333] leading-[1.8] text-lg mb-6">
              There is a particular kind of exhaustion that nonprofit leaders know. It is not the exhaustion of doing too much hard work. It is the exhaustion of doing the wrong work for too long.
            </p>
            <p className="text-[#333] leading-[1.8] mb-6">
              You went into this sector because you believed something. A community deserved better resources. Young people needed mentors who looked like them. The river needed protecting. Something with weight and meaning pulled you here.
            </p>
            <p className="text-[#333] leading-[1.8] mb-6">
              And then the work turned out to be: grant reports at 11 PM. Donor spreadsheets that have not been updated in three months. A board meeting you are walking into underprepared. A newsletter that was supposed to go out two weeks ago. Staff conflict that nobody has had time to sit with.
            </p>

            <h2 className="text-[26px] font-semibold text-black mt-10 mb-4">The trap is not laziness</h2>
            <p className="text-[#333] leading-[1.8] mb-6">
              The trap is not that nonprofit leaders are bad at their jobs. It is structural.
            </p>
            <p className="text-[#333] leading-[1.8] mb-6">
              Organizations grow. Programs expand. Funders multiply. The complexity of operations scales up continuously. But the staffing does not scale at the same rate. The executive director who ran a $200,000 organization is now running a $1.2 million organization with two more staff positions and five times the operational complexity -- and they are still doing a lot of the operational work themselves.
            </p>
            <p className="text-[#333] leading-[1.8] mb-6">
              This is not exceptional. This is the median experience of a nonprofit executive director in the United States.
            </p>

            <h2 className="text-[26px] font-semibold text-black mt-10 mb-4">What leadership actually requires</h2>
            <p className="text-[#333] leading-[1.8] mb-6">
              The work that requires a human leader -- the work that no AI can substitute for -- is the relational work. The board development. The community trust. The funder relationships where someone knows your name before the application arrives. The staff who stay because they believe in you and the culture you have built.
            </p>
            <p className="text-[#333] leading-[1.8] mb-6">
              The work that can be delegated, automated, or systematized is the operational work. Grant research. First drafts. Data organization. Compliance tracking. Meeting prep. Social media scheduling. Budget-to-actual analysis. These are important tasks. They are not uniquely human tasks.
            </p>
            <p className="text-[#333] leading-[1.8] mb-6">
              When leaders are doing those tasks themselves -- because there is no one else to do them -- they are spending the scarcest resource they have on work that could be handled differently. And the relational work, the vision work, the irreplaceable human leadership work, gets squeezed out.
            </p>

            <h2 className="text-[26px] font-semibold text-black mt-10 mb-4">What changes when you have a team</h2>
            <p className="text-[#333] leading-[1.8] mb-6">
              The leaders who have full teams -- the ones with a development director and a communications manager and a finance person and an executive assistant -- are not different kinds of leaders. They are the same leaders with better infrastructure.
            </p>
            <p className="text-[#333] leading-[1.8] mb-6">
              They come to board meetings prepared because someone prepared them. They have informed donor conversations because someone maintained the donor records. They know where their cash runway stands because someone is watching the numbers. They can take a risk on a new program because someone already thought through the financial implications.
            </p>
            <p className="text-[#333] leading-[1.8] mb-6">
              That is what we are trying to give leaders who have been leading without backup. Not a chatbot that answers questions when you remember to ask. A team that shows up. That checks in. That handles the operational layer so the leader can actually lead.
            </p>
            <p className="text-[#333] leading-[1.8] mb-6">
              The mission was always there. The vision was always there. The thing that was missing was backup.
            </p>

            <div className="bg-[#1a2b32] rounded-xl p-8 mt-10 text-white">
              <h3 className="text-lg font-semibold text-[#8B5CF6] mb-3">Stop doing the work your team should do.</h3>
              <p className="text-white/70 text-sm leading-[1.7] mb-5">
                Brief your AI team on your mission. Let them handle the operational layer. Go lead.
              </p>
              <Link href="/signup" className="spial-btn no-underline inline-flex">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SpialFooter />
    </div>
  );
}
