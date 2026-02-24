'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { CommunityCard } from '../../(components)/communities/CommunityCard';
import { MyInvitesBanner } from '@/components/communities/MyInvitesBanner';
import Link from 'next/link';
import { Search, Users, SlidersHorizontal, X } from 'lucide-react';

const CATEGORIES = ['All', 'Academic', 'Research', 'Social', 'Sports', 'Clubs', 'Technology', 'Arts', 'Professional'];

const CommunityCardSkeleton = () => <div className="border rounded-lg bg-card h-[260px] animate-pulse" />;

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

    // Client-side sort by newest (backend sorts by member count by default)
    const sortedCommunities = useMemo(() => {
        if (!communities) return undefined;
        if (sortBy === 'newest') {
            return [...communities].sort((a, b) => b.createdAt - a.createdAt);
        }
        return communities; // already sorted by member count from backend
    }, [communities, sortBy]);

    const hasActiveFilters = selectedCategory !== 'All' || debouncedSearch.length > 0;

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Communities</h1>
                    <p className="text-sm text-muted-foreground mt-1">Discover and join communities that match your interests</p>
                </div>
                <Link href="/communities/new">
                    <button className="h-10 py-2 px-4 btn-press bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-semibold">
                        Create Community
                    </button>
                </Link>
            </div>

            {/* Community Invite Banner */}
            <div className="mb-6">
                <MyInvitesBanner />
            </div>

            {/* Search & Filter Controls */}
            <div className="mb-6 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search communities by name or description..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    {searchInput && (
                        <button
                            onClick={() => setSearchInput('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted"
                        >
                            <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                    )}
                </div>

                {/* Category Pills + Sort */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                                    selectedCategory === cat
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'members' | 'newest')}
                            className="text-xs border rounded-md px-2 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                        >
                            <option value="members">Most Members</option>
                            <option value="newest">Newest</option>
                        </select>
                    </div>
                </div>

                {/* Active filter chips */}
                {hasActiveFilters && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Filters:</span>
                        {selectedCategory !== 'All' && (
                            <span className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {selectedCategory}
                                <button onClick={() => setSelectedCategory('All')}>
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        {debouncedSearch && (
                            <span className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                &quot;{debouncedSearch}&quot;
                                <button onClick={() => setSearchInput('')}>
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}
                        <button
                            onClick={() => { setSelectedCategory('All'); setSearchInput(''); }}
                            className="text-xs underline hover:text-foreground"
                        >
                            Clear all
                        </button>
                    </div>
                )}
            </div>

            {/* Loading State */}
            {sortedCommunities === undefined && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => <CommunityCardSkeleton key={i} />)}
                </div>
            )}

            {/* Empty State */}
            {sortedCommunities && sortedCommunities.length === 0 && (
                <div className="text-center py-16">
                    <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">
                        {hasActiveFilters ? 'No communities match your search' : 'No communities yet'}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2">
                        {hasActiveFilters
                            ? 'Try adjusting your filters or search terms.'
                            : 'Be the first to create a community!'}
                    </p>
                    {hasActiveFilters && (
                        <button
                            onClick={() => { setSelectedCategory('All'); setSearchInput(''); }}
                            className="mt-4 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            )}

            {/* Results Count */}
            {sortedCommunities && sortedCommunities.length > 0 && (
                <p className="text-xs text-muted-foreground mb-4">
                    {sortedCommunities.length} communit{sortedCommunities.length === 1 ? 'y' : 'ies'} found
                </p>
            )}

            {/* Community Grid */}
            {sortedCommunities && sortedCommunities.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {sortedCommunities.map(community => (
                        <CommunityCard key={community._id} community={community as any} />
                    ))}
                </div>
            )}
        </div>
    );
}
