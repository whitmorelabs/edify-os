import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SpialNavbar from "@/components/spial-navbar";
import SpialFooter from "@/components/spial-footer";
import SectionLabel from "@/components/section-label";

export const metadata = {
  title: "Blog | Edify OS",
  description: "Perspectives on nonprofit leadership, AI, and the operational realities of running a mission-driven organization.",
};

const articles = [
  {
    slug: "ai-wont-replace-your-team",
    category: "AI for Nonprofits",
    title: "Why AI Won't Replace Your Team. It'll Complete It.",
    excerpt: "Every nonprofit leader we talk to asks the same question: is this going to take someone's job? The honest answer is no -- and here is why the fear itself points to something important.",
    date: "April 8, 2026",
    readTime: "6 min read",
    featured: true,
    image: "https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=800",
  },
  {
    slug: "grant-research-problem",
    category: "Fundraising",
    title: "The Grant Research Problem Nobody Talks About",
    excerpt: "Everyone knows grant writing is hard. But the thing that kills most grant programs isn't the writing -- it's the research that never happens because nobody has time.",
    date: "April 1, 2026",
    readTime: "5 min read",
    featured: false,
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600",
  },
  {
    slug: "affordable-development-director",
    category: "Fundraising",
    title: "What Happens When Every Nonprofit Can Afford a Development Director",
    excerpt: "The organizations that raise the most money are not the most deserving. They are the ones with dedicated development staff. That gap is about to close.",
    date: "March 25, 2026",
    readTime: "7 min read",
    featured: false,
    image: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600",
  },
  {
    slug: "from-drowning-to-leading",
    category: "Leadership",
    title: "From Drowning in Admin to Leading with Vision",
    excerpt: "There is a particular kind of exhaustion that nonprofit leaders know. It is not from working too hard. It is from working on the wrong things for too long.",
    date: "March 18, 2026",
    readTime: "8 min read",
    featured: false,
    image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600",
  },
];

export default function BlogPage() {
  const [featured, ...rest] = articles;

  return (
    <div className="spial-page">
      <SpialNavbar />

      {/* Hero */}
      <section className="bg-[#1a2b32] py-20">
        <div className="spial-container mx-auto text-center">
          <SectionLabel text="Blog" />
          <h1 className="text-white text-[36px] md:text-[52px] font-semibold leading-[1.2] mb-5 max-w-[700px] mx-auto">
            For the people doing the work.
          </h1>
          <p className="text-white/80 text-lg leading-[1.7] max-w-[600px] mx-auto">
            Perspectives on nonprofit leadership, AI, and the operational realities of running a mission-driven organization.
          </p>
        </div>
      </section>

      {/* Featured Article */}
      <section className="py-16 bg-[#f7f6f5]">
        <div className="spial-container mx-auto">
          <Link
            href={`/blog/${featured.slug}`}
            className="block bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden no-underline transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] group"
          >
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={featured.image} alt={featured.title} className="w-full aspect-[4/3] object-cover" />
              <div className="p-10 flex flex-col justify-center">
                <div className="text-xs text-[#8B5CF6] font-semibold uppercase mb-3">{featured.category} -- Featured</div>
                <h2 className="text-[26px] font-semibold text-black mb-4 group-hover:text-[#8B5CF6] transition-colors duration-300">
                  {featured.title}
                </h2>
                <p className="text-[#666] leading-[1.7] mb-6">{featured.excerpt}</p>
                <div className="flex items-center gap-4 text-sm text-[#999]">
                  <span>{featured.date}</span>
                  <span>--</span>
                  <span>{featured.readTime}</span>
                </div>
                <div className="flex items-center gap-2 text-[#8B5CF6] text-sm font-medium mt-6">
                  Read article
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Article Grid */}
      <section className="py-10 pb-20 bg-[#f7f6f5]">
        <div className="spial-container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {rest.map((article) => (
              <Link
                key={article.slug}
                href={`/blog/${article.slug}`}
                className="bg-white rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.05)] no-underline transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_8px_16px_rgba(0,0,0,0.1)] block group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={article.image} alt={article.title} className="w-full h-[200px] object-cover" />
                <div className="p-7">
                  <div className="text-xs text-[#8B5CF6] font-semibold uppercase mb-2.5">
                    {article.category}
                  </div>
                  <h3 className="text-xl font-semibold text-black mb-3 group-hover:text-[#8B5CF6] transition-colors duration-300 leading-[1.3]">
                    {article.title}
                  </h3>
                  <p className="text-[#666] text-sm leading-[1.6] mb-4">{article.excerpt}</p>
                  <div className="flex items-center gap-3 text-[13px] text-[#999]">
                    <span>{article.date}</span>
                    <span>--</span>
                    <span>{article.readTime}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 bg-[#392e3b] text-white">
        <div className="spial-container mx-auto text-center">
          <h2 className="text-[28px] md:text-[34px] font-medium text-white mb-4">
            Get new articles in your inbox.
          </h2>
          <p className="text-white/70 leading-[1.7] max-w-[500px] mx-auto mb-8">
            We write about nonprofit leadership, AI, and what it actually looks like when operational gaps get filled. No fluff.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-[450px] mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-5 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm outline-none focus:border-[#8B5CF6] transition-colors"
            />
            <button className="spial-btn whitespace-nowrap">
              Subscribe
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <SpialFooter />
    </div>
  );
}
