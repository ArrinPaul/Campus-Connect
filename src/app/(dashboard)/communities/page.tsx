'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@/lib/api';
import { api } from '@/lib/api';
import { CommunityCard } from '../../(components)/communities/CommunityCard';
import { MyInvitesBanner } from '@/components/communities/MyInvitesBanner';
import { Section, SectionHeader } from '@/components/ui/Section';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Search, Users, SlidersHorizontal, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES = ['All', 'Academic', 'Research', 'Social', 'Sports', 'Clubs', 'Technology', 'Arts', 'Professional'];

const CommunityCardSkeleton = () => (
    <div className="bg-canvas border border-hairline rounded-lg h-[340px] animate-pulse" />
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
            <Section variant="parchment" className="py-xl">
                <SectionHeader 
                    title="Communities." 
                    tagline="Discover and join groups that match your academic interests and career goals."
                >
                    <Link href="/communities/new">
                        <Button variant="primary" size="default" className="flex items-center gap-2">
                            <Plus size={18} /> Create Community
                        </Button>
                    </Link>
                </SectionHeader>

                {/* My Invites Banner */}
                <div className="w-full max-w-4xl mt-lg">
                    <MyInvitesBanner />
                </div>
            </Section>

            {/* Filter & Grid Section */}
            <Section variant="light" className="py-lg">
                <div className="w-full max-w-6xl space-y-lg">
                    
                    {/* Search Bar - Apple Style Pill */}
                    <div className="relative max-w-2xl mx-auto group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted-48 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search communities..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full pl-10 pr-10 h-11 rounded-pill border border-hairline bg-canvas text-body focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                        />
                        {searchInput && (
                            <button
                                onClick={() => setSearchInput('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-canvas-parchment text-ink-muted-48"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Category Tabs + Sort */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-hairline pb-md">
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 w-full scrollbar-none">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={cn(
                                        "px-4 py-2 rounded-pill text-caption font-semibold whitespace-nowrap transition-all btn-press border",
                                        selectedCategory === cat
                                            ? "bg-ink text-white border-ink"
                                            : "bg-canvas text-ink border-hairline hover:bg-canvas-parchment"
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                        
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <SlidersHorizontal className="h-4 w-4 text-ink-muted-48" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as 'members' | 'newest')}
                                className="text-caption font-semibold bg-canvas-parchment rounded-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                            >
                                <option value="members">Most Members</option>
                                <option value="newest">Newest First</option>
                            </select>
                        </div>
                    </div>

                    {/* Active Filter Chips */}
                    {hasActiveFilters && (
                        <div className="flex items-center gap-3 text-caption font-semibold text-ink-muted-48">
                            <span>Filtering by:</span>
                            {selectedCategory !== 'All' && (
                                <Button variant="pearl" size="sm" className="h-7 gap-1" onClick={() => setSelectedCategory('All')}>
                                    {selectedCategory} <X size={12} />
                                </Button>
                            )}
                            {debouncedSearch && (
                                <Button variant="pearl" size="sm" className="h-7 gap-1" onClick={() => setSearchInput('')}>
                                    &quot;{debouncedSearch}&quot; <X size={12} />
                                </Button>
                            )}
                            <button
                                onClick={() => { setSelectedCategory('All'); setSearchInput(''); }}
                                className="text-primary hover:underline"
                            >
                                Clear all
                            </button>
                        </div>
                    )}

                    {/* Community Grid */}
                    <div className="w-full">
                        {sortedCommunities === undefined ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg">
                                {[...Array(8)].map((_, i) => <CommunityCardSkeleton key={i} />)}
                            </div>
                        ) : sortedCommunities.length === 0 ? (
                            <div className="text-center py-20 bg-canvas-parchment/30 rounded-lg border border-dashed border-hairline">
                                <Users className="h-16 w-16 mx-auto mb-4 text-ink/10" />
                                <h3 className="text-display-md text-ink">No communities found.</h3>
                                <p className="text-body text-ink-muted-48 mt-2 max-w-md mx-auto">
                                    {hasActiveFilters 
                                        ? 'Try adjusting your search or category filters to find what you are looking for.' 
                                        : 'Be the first to create a community and start connecting!'}
                                </p>
                                {hasActiveFilters && (
                                    <Button
                                        variant="secondary"
                                        className="mt-8"
                                        onClick={() => { setSelectedCategory('All'); setSearchInput(''); }}
                                    >
                                        Reset All Filters
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-md">
                                <div className="text-fine-print text-ink-muted-48 font-bold uppercase tracking-widest">
                                    {sortedCommunities.length} {sortedCommunities.length === 1 ? 'Community' : 'Communities'} found
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg">
                                    {sortedCommunities.map((community: any) => (
                                        <CommunityCard key={community._id} community={community as any} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Section>
        </div>
    );
}
