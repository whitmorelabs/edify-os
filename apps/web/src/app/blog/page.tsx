import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SpialNavbar from "@/components/spial-navbar";
import SpialFooter from "@/components/spial-footer";
import { Button } from "@/components/ui";

export const metadata = {
  title: "Blog | Edify OS",
  description: "Perspectives on nonprofit leadership, AI, and the operational realities of running a mission-driven organization.",
};

const articles = [
  {
    slug: "ai-wont-replace-your-team",
    category: "AI for nonprofits",
    title: "Why AI won't replace your team. It'll complete it.",
    excerpt: "Every nonprofit leader we talk to asks the same question: is this going to take someone's job? The honest answer is no -- and here is why the fear itself points to something important.",
    date: "April 8, 2026",
    readTime: "6 min read",
    featured: true,
    image: "/blog/ai-wont-replace-your-team.jpg",
    imageAlt: "Diverse team collaborating around a table, sharing a high-five",
  },
  {
    slug: "grant-research-problem",
    category: "Fundraising",
    title: "The grant research problem nobody talks about",
    excerpt: "Everyone knows grant writing is hard. But the thing that kills most grant programs isn't the writing -- it's the research that never happens because nobody has time.",
    date: "April 1, 2026",
    readTime: "5 min read",
    featured: false,
    image: "/blog/grant-research-problem.jpg",
    imageAlt: "Two women studying together at a table with a laptop",
  },
  {
    slug: "affordable-development-director",
    category: "Fundraising",
    title: "What happens when every nonprofit can afford a development director",
    excerpt: "The organizations that raise the most money are not the most deserving. They are the ones with dedicated development staff. That gap is about to close.",
    date: "March 25, 2026",
    readTime: "7 min read",
    featured: false,
    image: "/blog/affordable-development-director.jpg",
    imageAlt: "Woman leader with arms crossed, smiling confidently",
  },
  {
    slug: "from-drowning-to-leading",
    category: "Leadership",
    title: "From drowning in admin to leading with vision",
    excerpt: "There is a particular kind of exhaustion that nonprofit leaders know. It is not from working too hard. It is from working on the wrong things for too long.",
    date: "March 18, 2026",
    readTime: "8 min read",
    featured: false,
    image: "/blog/from-drowning-to-leading.jpg",
    imageAlt: "Silhouette of a woman against a dramatic pink and purple sunset sky",
  },
];

export default function BlogPage() {
  const [featured, ...rest] = articles;

  return (
    <div className="bg-bg-0 min-h-screen">
      <SpialNavbar />

      {/* Hero */}
      <section className="bg-bg-plum-1 py-20">
        <div className="spial-container mx-auto text-center">
          <div className="eyebrow mb-4">Blog</div>
          <h1 className="text-fg-1 text-[36px] md:text-[52px] font-semibold leading-[1.2] tracking-[-0.02em] mb-5">
            For the people doing the work.
          </h1>
          <p className="text-fg-2 text-lg leading-[1.7] max-w-[600px] mx-auto">
            Perspectives on nonprofit leadership, AI, and the operational realities of running a mission-driven organization.
          </p>
        </div>
      </section>

      {/* Featured Article */}
      <section className="py-16 bg-bg-1">
        <div className="spial-container mx-auto">
          <Link
            href={`/blog/${featured.slug}`}
            className="block bg-bg-2 shadow-elev-1 rounded-2xl overflow-hidden no-underline transition-all duration-300 hover:-translate-y-1 hover:shadow-elev-2 group"
          >
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={featured.image} alt={featured.imageAlt} className="w-full aspect-[4/3] object-cover" />
              <div className="p-10 flex flex-col justify-center">
                <div className="eyebrow mb-3">{featured.category} -- Featured</div>
                <h2 className="text-[26px] font-semibold tracking-[-0.01em] text-fg-1 mb-4 group-hover:text-brand-500 transition-colors duration-300">
                  {featured.title}
                </h2>
                <p className="text-fg-3 leading-[1.7] mb-6">{featured.excerpt}</p>
                <div className="flex items-center gap-4 text-sm text-fg-4">
                  <span>{featured.date}</span>
                  <span>--</span>
                  <span>{featured.readTime}</span>
                </div>
                <div className="flex items-center gap-2 text-brand-500 text-sm font-semibold mt-6">
                  Read article
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Article Grid */}
      <section className="py-10 pb-20 bg-bg-1">
        <div className="spial-container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {rest.map((article) => (
              <Link
                key={article.slug}
                href={`/blog/${article.slug}`}
                className="bg-bg-2 shadow-elev-1 rounded-xl overflow-hidden no-underline transition-all duration-300 hover:-translate-y-2 hover:shadow-elev-2 block group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={article.image} alt={article.imageAlt} className="w-full h-[200px] object-cover" />
                <div className="p-7">
                  <div className="eyebrow mb-2.5">
                    {article.category}
                  </div>
                  <h3 className="text-xl font-semibold text-fg-1 mb-3 group-hover:text-brand-500 transition-colors duration-300 leading-[1.3]">
                    {article.title}
                  </h3>
                  <p className="text-fg-3 text-sm leading-[1.6] mb-4">{article.excerpt}</p>
                  <div className="flex items-center gap-3 text-[13px] text-fg-4">
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
      <section className="py-20 bg-bg-0">
        <div className="spial-container mx-auto text-center">
          <h2 className="text-[28px] md:text-[34px] font-semibold tracking-[-0.01em] text-fg-1 mb-4">
            Get new articles in your inbox.
          </h2>
          <p className="text-fg-3 leading-[1.7] max-w-[500px] mx-auto mb-8">
            We write about nonprofit leadership, AI, and what it actually looks like when operational gaps get filled. No fluff.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-[450px] mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-5 py-3 rounded-lg bg-bg-2 border border-bg-3 text-fg-1 placeholder:text-fg-4 text-sm outline-none focus:border-brand-500 transition-colors"
            />
            <Button variant="primary" size="md" trailingIcon={<ArrowRight className="w-4 h-4" />}>
              Subscribe
            </Button>
          </div>
        </div>
      </section>

      <SpialFooter />
    </div>
  );
}
