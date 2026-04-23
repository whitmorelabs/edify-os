'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, FileText } from 'lucide-react';
import { SearchBox } from './SearchBox';
import { Suspense } from 'react';
import { Card, Button } from '@/components/ui';

// Static article data — keeps search working without server-side fs reads
const GUIDE_ARTICLES: { slug: string; title: string; keywords: string[] }[] = [
  { slug: 'getting-started', title: 'Getting started', keywords: ['getting started', 'setup', 'introduction', 'onboarding', 'begin'] },
  { slug: 'working-with-your-team', title: 'Working with your team', keywords: ['team', 'collaboration', 'working', 'archetypes', 'directors'] },
  { slug: 'organization-setup', title: 'Organization setup', keywords: ['organization', 'setup', 'configure', 'settings', 'profile'] },
  { slug: 'faq', title: 'Frequently asked questions', keywords: ['faq', 'questions', 'help', 'answers', 'common'] },
  { slug: 'troubleshooting', title: 'Troubleshooting', keywords: ['troubleshoot', 'error', 'fix', 'problem', 'issue', 'debug'] },
  { slug: 'meet-your-team/development-director', title: 'Development Director', keywords: ['development', 'fundraising', 'grants', 'donors', 'director'] },
  { slug: 'meet-your-team/marketing-director', title: 'Marketing Director', keywords: ['marketing', 'campaigns', 'brand', 'content', 'social media'] },
  { slug: 'meet-your-team/executive-assistant', title: 'Executive Assistant', keywords: ['executive', 'assistant', 'schedule', 'calendar', 'email', 'triage'] },
  { slug: 'meet-your-team/programs-director', title: 'Programs Director', keywords: ['programs', 'compliance', 'outcomes', 'director', 'delivery'] },
  { slug: 'meet-your-team/hr-volunteer-coordinator', title: 'HR & Volunteer Coordinator', keywords: ['hr', 'human resources', 'volunteer', 'coordinator', 'hiring', 'staff'] },
  { slug: 'meet-your-team/events-director', title: 'Events Director', keywords: ['events', 'gala', 'sponsorship', 'logistics', 'director'] },
];

function buildHref(slug: string): string {
  return `/dashboard/guide/${slug}`;
}

interface SearchResult {
  slug: string;
  title: string;
  href: string;
}

function searchArticles(query: string): SearchResult[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();

  return GUIDE_ARTICLES
    .filter((article) => {
      const titleMatch = article.title.toLowerCase().includes(q);
      const keywordMatch = article.keywords.some((k) => k.includes(q));
      return titleMatch || keywordMatch;
    })
    .sort((a, b) => {
      const aTitle = a.title.toLowerCase().includes(q) ? 0 : 1;
      const bTitle = b.title.toLowerCase().includes(q) ? 0 : 1;
      return aTitle - bTitle;
    })
    .map((article) => ({
      slug: article.slug,
      title: article.title,
      href: buildHref(article.slug),
    }));
}

function SearchPageInner() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const results = searchArticles(query);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="heading-1">Search the help center</h1>
        <p className="mt-1 text-fg-3">Search articles, guides, and FAQ.</p>
      </div>

      <SearchBox initialQuery={query} />

      {query && (
        <div>
          <p className="text-sm text-fg-3 mb-4">
            {results.length === 0
              ? `No results for "${query}"`
              : `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`}
          </p>

          {results.length === 0 ? (
            <Card elevation={1} className="p-12 text-center">
              <Search className="mx-auto h-10 w-10 text-fg-4" />
              <p className="mt-4 font-medium text-fg-1">No articles found</p>
              <p className="mt-1 text-sm text-fg-3">
                Try a different search term, or{' '}
                <Link href="/dashboard/guide" className="text-brand-500 underline">
                  browse all topics
                </Link>
                .
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {results.map((result) => (
                <Link
                  key={result.slug}
                  href={result.href}
                  className="flex gap-4 items-start p-5 rounded-[14px] transition hover:-translate-y-[1px]"
                  style={{ background: 'var(--bg-2)', boxShadow: 'var(--shadow-elev-1)' }}
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: 'var(--bg-3)' }}
                  >
                    <FileText size={16} style={{ color: 'var(--brand-purple)' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-fg-1">{result.title}</p>
                    <p className="mt-2 text-xs text-brand-500">{result.href}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {!query && (
        <Card elevation={1} className="p-8 text-center">
          <Search className="mx-auto h-10 w-10 text-fg-4" />
          <p className="mt-4 text-sm text-fg-3">Type a search term to find articles.</p>
          <Link href="/dashboard/guide">
            <Button variant="secondary" size="sm" className="mt-4">
              Browse all topics
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="space-y-6 animate-fade-in"><div><h1 className="heading-1">Search the help center</h1></div></div>}>
      <SearchPageInner />
    </Suspense>
  );
}
