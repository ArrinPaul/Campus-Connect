'use client';

import { Suspense, useState } from 'react';
import { ExplorePostGrid } from '@/app/(components)/explore/ExplorePostGrid';
import { Search, Compass, Sparkles, TrendingUp } from 'lucide-react';
import Link from 'next/link';

const ExplorePostGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {[...Array(9)].map((_, i) => (
      <div key={i} className="border border-border/60 rounded-2xl bg-card p-4 h-[320px] animate-pulse" />
    ))}
  </div>
);

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="w-full bg-canvas min-h-screen space-y-4">
      {/* Search & Header Bar */}
      <section className="bg-card/80 backdrop-blur-xl border border-border/80 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Compass className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
                <span>Explore Campus</span>
                <Sparkles className="h-4 w-4 text-amber-500" />
              </h1>
              <p className="text-xs text-muted-foreground">
                Trending discussions, research, and discoveries
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/search"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors w-full sm:w-64"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
              <span>Search posts, people, tags...</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Discovery Feed Grid */}
      <section className="w-full">
        <Suspense fallback={<ExplorePostGridSkeleton />}>
          <ExplorePostGrid />
        </Suspense>
      </section>
    </div>
  );
}
