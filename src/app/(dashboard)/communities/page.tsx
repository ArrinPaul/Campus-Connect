'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@/lib/api';
import { api } from '@/lib/api';
import { CommunityCard } from '../../(components)/communities/CommunityCard';
import { MyInvitesBanner } from '@/components/communities/MyInvitesBanner';
import Link from 'next/link';
import { Search, Users, SlidersHorizontal, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES = ['All', 'Academic', 'Research', 'Social', 'Sports', 'Clubs', 'Technology', 'Arts', 'Professional'];

const CommunityCardSkeleton = () => (
    <div className="bg-canvas border border-hairline rounded-xl h-[340px] animate-pulse" />
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
        <div className="w-full bg-canvas min-h-screen">
            {/* Header Section */}
            <section className="bg-canvas py-section-sm px-base md:px-xl border-b border-hairline-soft">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-xl">
                    <div className="max-w-2xl">
                        <h1 className="text-display-lg text-ink-deep mb-md">Communities.</h1>
                        <p className="text-subtitle-md text-ink">
                            Discover and join groups that match your academic interests and career goals.
                        </p>
                    </div>
                    <Link href="/communities/new">
                        <button className="button-buy-cta">
                            <Plus size={18} className="mr-2" /> Create Community
                        </button>
                    </Link>
                </div>

                {/* My Invites Banner */}
                <div className="w-full max-w-6xl mx-auto mt-xl">
                    <MyInvitesBanner />
                </div>
            </section>

            {/* Filter & Grid Section */}
            <section className="py-section-sm px-base md:px-xl">
                <div className="w-full max-w-6xl mx-auto space-y-xl">
                    
                    {/* Search Bar */}
                    <div className="relative max-w-2xl mx-auto group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-steel group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search communities..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full pl-12 pr-12 h-[48px] rounded-full border border-hairline bg-surface-soft text-body-md text-ink focus:outline-none focus:border-2 focus:border-fb-blue focus:bg-canvas transition-all"
                        />
                        {searchInput && (
                            <button
                                onClick={() => setSearchInput('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-canvas-soft text-steel"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Category Tabs + Sort */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-hairline pb-md">
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full scrollbar-custom">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={selectedCategory === cat ? "button-pill-tab-active shrink-0" : "button-pill-tab shrink-0"}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0 bg-surface-soft rounded-lg p-xs border border-hairline">
                            <SlidersHorizontal className="h-4 w-4 text-steel ml-2" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as 'members' | 'newest')}
                                className="text-body-sm-bold text-ink bg-transparent px-2 py-1 focus:outline-none appearance-none cursor-pointer"
                            >
                                <option value="members">Most Members</option>
                                <option value="newest">Newest First</option>
                            </select>
                        </div>
                    </div>

                    {/* Active Filter Chips */}
                    {hasActiveFilters && (
                        <div className="flex items-center gap-3 text-caption-bold text-steel">
                            <span>Filtering by:</span>
                            {selectedCategory !== 'All' && (
                                <button className="button-pill-tab py-1 px-3 h-auto" onClick={() => setSelectedCategory('All')}>
                                    {selectedCategory} <X size={12} className="ml-1" />
                                </button>
                            )}
                            {debouncedSearch && (
                                <button className="button-pill-tab py-1 px-3 h-auto" onClick={() => setSearchInput('')}>
                                    &quot;{debouncedSearch}&quot; <X size={12} className="ml-1" />
                                </button>
                            )}
                            <button
                                onClick={() => { setSelectedCategory('All'); setSearchInput(''); }}
                                className="text-primary hover:underline ml-2"
                            >
                                Clear all
                            </button>
                        </div>
                    )}

                    {/* Community Grid */}
                    <div className="w-full">
                        {sortedCommunities === undefined ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-xl">
                                {[...Array(8)].map((_, i) => <CommunityCardSkeleton key={i} />)}
                            </div>
                        ) : sortedCommunities.length === 0 ? (
                            <div className="text-center py-section bg-surface-soft rounded-xxxl border border-hairline-soft">
                                <Users className="h-16 w-16 mx-auto mb-md text-steel opacity-50" />
                                <h3 className="text-heading-lg text-ink-deep mb-sm">No communities found.</h3>
                                <p className="text-body-md text-steel max-w-md mx-auto mb-xl">
                                    {hasActiveFilters 
                                        ? 'Try adjusting your search or category filters to find what you are looking for.' 
                                        : 'Be the first to create a community and start connecting!'}
                                </p>
                                {hasActiveFilters && (
                                    <button
                                        className="button-secondary"
                                        onClick={() => { setSelectedCategory('All'); setSearchInput(''); }}
                                    >
                                        Reset All Filters
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-xl">
                                <div className="text-caption-bold text-steel uppercase tracking-wide">
                                    {sortedCommunities.length} {sortedCommunities.length === 1 ? 'Community' : 'Communities'} found
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-xl">
                                    {sortedCommunities.map((community: any) => (
                                        <CommunityCard key={community._id} community={community as any} />
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
