'use client';

import { Suspense } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import { UserCard } from '../../../../(components)/search/UserCard'; // Reusing UserCard

type PageProps = {
    params: {
        slug: string;
    };
};

const CommunityMembersPageSkeleton = () => (
    <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="h-10 w-48 bg-muted/50 rounded-md animate-pulse mb-6" />
        <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 border rounded-lg bg-card h-24 animate-pulse" />
            ))}
        </div>
    </div>
);

function CommunityMembersPageContent({ slug }: { slug: string }) {
    const community = useQuery(api.communities.getCommunity, { slug });
    const members = useQuery(api.communities.getCommunityMembers, community ? { communityId: community._id } : 'skip');

    if (community === undefined || members === undefined) {
        return <CommunityMembersPageSkeleton />;
    }

    if (community === null) {
        notFound();
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <Link href={`/c/${slug}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to {community.name}
            </Link>
            
            <h1 className="text-3xl font-bold mb-6">Members of {community.name}</h1>

            <div className="space-y-4">
                {members.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                        <Users className="h-16 w-16 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold">No members yet</h3>
                        <p className="text-sm mt-2">Be the first to join this community!</p>
                    </div>
                ) : (
                    members.map(member => (
                        <UserCard key={member?.userId} user={member as any} /> 
                    ))
                )}
            </div>
        </div>
    );
}

export default function CommunityMembersPage({ params }: PageProps) {
    return (
        <Suspense fallback={<CommunityMembersPageSkeleton />}>
            <CommunityMembersPageContent slug={params.slug} />
        </Suspense>
    );
}
