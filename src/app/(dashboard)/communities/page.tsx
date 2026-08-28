'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@/lib/api';
import { api } from '@/lib/api';
import { CommunityCard } from '../../(components)/communities/CommunityCard';
import { MyInvitesBanner } from '@/components/communities/MyInvitesBanner';
import Link from 'next/link';
import { Search, Users, SlidersHorizontal, X, Plus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES = ['All', 'Academic', 'Research', 'Social', 'Sports', 'Clubs', 'Technology', 'Arts', 'Professional'];

const CommunityCardSkeleton = () => (
  <div className="bg-card border border-border rounded-lg h-[320px] animate-pulse" />
);

export default function CommunitiesPage() {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'members' | 'newest'>('members');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const queryArgs = useMemo(() => ({
    ...(selectedCategory !== 'All' ? { category: selectedCategory } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  }), [selectedCategory, debouncedSearch]);

  const communities = useQuery(api.communities.getCommunities, queryArgs);

  const sortedCommunities = useMemo(() => {
    if (!communities) return undefined;
    if (sortBy === 'newest') {
      return [...communities].sort((a, b) => b.createdAt - a.createdAt);
    }
    return communities;
  }, [communities, sortBy]);

  const hasActiveFilters = selectedCategory !== 'All' || debouncedSearch.length > 0;

  return (
    <div className="w-full bg-canvas min-h-screen pb-16">
      {/* Header Section */}
      <section className="bg-canvas pt-8 pb-6 px-4 md:px-8 border-b border-border">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Communities</h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                Discover, join, and collaborate with student groups that match your passions.
              </p>
            </div>
            <Link href="/communities/new" className="shrink-0">
              <button className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-primary/90 active:scale-[0.97] transition-all cursor-pointer">
                <Plus size={16} /> Create Community
              </button>
            </Link>
          </div>

          {/* My Invites Banner */}
          <MyInvitesBanner />
        </div>
      </section>

      {/* Filter & Grid Section */}
      <section className="pt-6 px-4 md:px-8">
        <div className="w-full max-w-6xl mx-auto space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Bar */}
            <div className="relative w-full md:max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search communities..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-11 pr-10 h-11 rounded-full border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:bg-canvas transition-all"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-canvas text-muted-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Sort Control */}
            <div className="flex items-center gap-2 shrink-0 bg-card rounded-full px-4 py-2 border border-border text-xs font-semibold text-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'members' | 'newest')}
                className="bg-transparent text-xs font-bold text-primary focus:outline-none cursor-pointer"
              >
                <option value="members">Most Members</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>

          {/* Category Pill Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-border">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer active:scale-[0.96]",
                  selectedCategory === cat
                    ? "bg-primary text-white shadow-sm"
                    : "bg-card text-muted-foreground border border-border hover:border-primary/40 hover:text-primary"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Active Filters Bar */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Active filters:</span>
              {selectedCategory !== 'All' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {selectedCategory}
                  <X size={12} className="cursor-pointer hover:opacity-80" onClick={() => setSelectedCategory('All')} />
                </span>
              )}
              {debouncedSearch && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  &quot;{debouncedSearch}&quot;
                  <X size={12} className="cursor-pointer hover:opacity-80" onClick={() => setSearchInput('')} />
                </span>
              )}
              <button
                onClick={() => { setSelectedCategory('All'); setSearchInput(''); }}
                className="text-xs text-primary hover:underline ml-2 font-semibold"
              >
                Reset
              </button>
            </div>
          )}

          {/* Community Grid */}
          <div className="w-full">
            {sortedCommunities === undefined ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => <CommunityCardSkeleton key={i} />)}
              </div>
            ) : sortedCommunities.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-lg border border-border max-w-lg mx-auto">
                <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
                <h3 className="text-base font-semibold text-foreground">No communities found</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                  {hasActiveFilters 
                    ? 'Try adjusting your search query or category filters.' 
                    : 'Be the first to create a community and invite peers!'}
                </p>
                {hasActiveFilters && (
                  <button
                    className="mt-4 rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-foreground hover:bg-canvas transition-colors"
                    onClick={() => { setSelectedCategory('All'); setSearchInput(''); }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {sortedCommunities.length} {sortedCommunities.length === 1 ? 'Community' : 'Communities'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {sortedCommunities.map((community: any) => (
                    <div key={community._id} className="transition-transform duration-200 hover:-translate-y-1">
                      <CommunityCard community={community as any} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
