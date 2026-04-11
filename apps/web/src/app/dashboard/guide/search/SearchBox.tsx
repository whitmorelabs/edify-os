'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

interface SearchBoxProps {
  initialQuery?: string;
}

export function SearchBox({ initialQuery = '' }: SearchBoxProps) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/dashboard/guide/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative max-w-xl">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search articles..."
        className="input-field pl-11 pr-24 py-3"
        autoFocus
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary px-4 py-1.5 text-xs rounded-lg"
      >
        Search
      </button>
    </form>
  );
}
