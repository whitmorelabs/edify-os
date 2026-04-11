import Link from 'next/link';
import { Search, FileText } from 'lucide-react';
import { getAllGuideArticles } from '@/lib/guide-content';
import { SearchBox } from './SearchBox';

interface SearchResult {
  slug: string;
  title: string;
  snippet: string;
  href: string;
}

function buildHref(slug: string): string {
  return `/dashboard/guide/${slug}`;
}

function getSnippet(content: string, query: string, snippetLen = 200): string {
  const lower = content.toLowerCase();
  const queryLower = query.toLowerCase();
  const idx = lower.indexOf(queryLower);
  if (idx === -1) {
    return content.replace(/^#.+\n/m, '').replace(/#{1,4}\s+/g, '').trim().slice(0, snippetLen) + '...';
  }
  const start = Math.max(0, idx - 60);
  const end = Math.min(content.length, idx + snippetLen);
  const raw = content.slice(start, end).replace(/#{1,4}\s+/g, '').replace(/\*\*/g, '').replace(/\*/g, '');
  return (start > 0 ? '...' : '') + raw + (end < content.length ? '...' : '');
}

function searchArticles(query: string): SearchResult[] {
  if (!query.trim()) return [];
  const articles = getAllGuideArticles();
  const q = query.toLowerCase();
  const results: SearchResult[] = [];

  for (const article of articles) {
    const titleMatch = article.title.toLowerCase().includes(q);
    const contentMatch = article.content.toLowerCase().includes(q);
    if (titleMatch || contentMatch) {
      results.push({
        slug: article.slug,
        title: article.title,
        snippet: getSnippet(article.content, query),
        href: buildHref(article.slug),
      });
    }
  }

  // Title matches first
  results.sort((a, b) => {
    const aTitle = a.title.toLowerCase().includes(q) ? 0 : 1;
    const bTitle = b.title.toLowerCase().includes(q) ? 0 : 1;
    return aTitle - bTitle;
  });

  return results;
}

interface PageProps {
  searchParams: { q?: string };
}

export default function SearchPage({ searchParams }: PageProps) {
  const query = searchParams.q ?? '';
  const results = searchArticles(query);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="heading-1">Search the Help Center</h1>
        <p className="mt-1 text-slate-500">Search articles, guides, and FAQ.</p>
      </div>

      <SearchBox initialQuery={query} />

      {query && (
        <div>
          <p className="text-sm text-slate-500 mb-4">
            {results.length === 0
              ? `No results for "${query}"`
              : `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`}
          </p>

          {results.length === 0 ? (
            <div className="card p-12 text-center">
              <Search className="mx-auto h-10 w-10 text-slate-200" />
              <p className="mt-4 font-medium text-slate-700">No articles found</p>
              <p className="mt-1 text-sm text-slate-500">
                Try a different search term, or{' '}
                <Link href="/dashboard/guide" className="text-brand-600 underline">
                  browse all topics
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((result) => (
                <Link
                  key={result.slug}
                  href={result.href}
                  className="card-interactive p-5 flex gap-4 items-start"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                    <FileText size={16} className="text-brand-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{result.title}</p>
                    <p className="mt-1 text-sm text-slate-500 leading-relaxed line-clamp-3">
                      {result.snippet}
                    </p>
                    <p className="mt-2 text-xs text-brand-500">{result.href}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {!query && (
        <div className="card p-8 text-center">
          <Search className="mx-auto h-10 w-10 text-slate-200" />
          <p className="mt-4 text-sm text-slate-500">Type a search term to find articles.</p>
          <Link href="/dashboard/guide" className="mt-4 inline-flex btn-secondary text-sm px-4 py-2">
            Browse all topics
          </Link>
        </div>
      )}
    </div>
  );
}
