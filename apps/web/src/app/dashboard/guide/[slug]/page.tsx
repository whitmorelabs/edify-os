import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { readGuideFile, getAdjacentArticles, ARTICLE_ORDER } from '@/lib/guide-content';
import { renderMarkdown, extractHeadings } from '@/lib/markdown';
import { ArticleFeedback } from '../ArticleFeedback';

export function generateStaticParams() {
  // Only top-level slugs (not meet-your-team/* sub-paths)
  return ARTICLE_ORDER
    .filter((s) => !s.includes('/'))
    .map((slug) => ({ slug }));
}

interface PageProps {
  params: { slug: string };
}

export default function ArticlePage({ params }: PageProps) {
  const markdown = readGuideFile(`${params.slug}.md`);
  if (!markdown) notFound();

  const html = renderMarkdown(markdown);
  const headings = extractHeadings(markdown).filter((h) => h.level >= 2);
  const { prev, next } = getAdjacentArticles(params.slug);

  return (
    <div className="flex gap-8">
      {/* Main content */}
      <article className="flex-1 min-w-0 animate-fade-in">
        <div
          className="prose-guide"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Prev / Next */}
        <div
          className="mt-12 pt-8 flex items-center justify-between gap-4"
          style={{ borderTop: '1px solid var(--line-1)' }}
        >
          {prev ? (
            <Link
              href={`/dashboard/guide/${prev.slug}`}
              className="flex items-center gap-2 text-sm font-medium text-fg-2 hover:text-brand-500 transition group"
            >
              <ChevronLeft size={16} className="shrink-0" />
              <span>
                <span className="text-xs text-fg-3 block">Previous</span>
                {prev.title}
              </span>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link
              href={`/dashboard/guide/${next.slug}`}
              className="flex items-center gap-2 text-sm font-medium text-fg-2 hover:text-brand-500 transition text-right group"
            >
              <span>
                <span className="text-xs text-fg-3 block">Next</span>
                {next.title}
              </span>
              <ChevronRight size={16} className="shrink-0" />
            </Link>
          ) : (
            <div />
          )}
        </div>

        <ArticleFeedback slug={params.slug} />
      </article>

      {/* Table of contents */}
      {headings.length > 1 && (
        <aside className="hidden xl:block w-48 shrink-0">
          <div className="sticky top-6">
            <p className="label mb-3 text-fg-3">On this page</p>
            <nav className="space-y-1">
              {headings.map((h) => (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  className="block text-xs text-fg-3 hover:text-brand-500 transition leading-relaxed"
                  style={{ paddingLeft: h.level === 2 ? 0 : `${(h.level - 2) * 12}px` }}
                >
                  {h.text}
                </a>
              ))}
            </nav>
          </div>
        </aside>
      )}
    </div>
  );
}
