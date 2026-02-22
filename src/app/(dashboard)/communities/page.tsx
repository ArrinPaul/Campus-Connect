'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { CommunityCard } from '../../(components)/communities/CommunityCard';
import Link from 'next/link';

const CommunityCardSkeleton = () => <div className="border rounded-lg bg-card h-[260px] animate-pulse" />;

export default function CommunitiesPage() {
    const communities = useQuery(api.communities.getCommunities, {});

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Communities</h1>
                <Link href="/communities/new">
                    <button className="h-10 py-2 px-4 btn-press bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-semibold">
                        Create Community
                    </button>
                </Link>
            </div>
            
            {/* TODO: Add search and filter controls */}

            {communities === undefined && (
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => <CommunityCardSkeleton key={i} />)}
                 </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {communities?.map(community => (
                    <CommunityCard key={community._id} community={community as any} />
                ))}
            </div>
        </div>
    );
}
