'use client';

import React, { Suspense } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { notFound } from 'next/navigation';
import { CommunityHeader } from '../../../(components)/communities/CommunityHeader';
import { CommunityPostFeed } from '../../../(components)/communities/CommunityPostFeed';
import { CreatePost } from '../../../(components)/feed/CreatePost';

type PageProps = {
    params: {
        slug: string;
    };
};

function CommunityPageContent({ slug }: { slug: string }) {
    const community = useQuery(api.communities.getCommunity, { slug });

    if (community === undefined) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4">
                <div className="h-48 w-full bg-muted animate-pulse rounded-lg" />
                <div className="mt-6 space-y-4">
                    <div className="h-8 w-1/3 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                </div>
            </div>
        );
    }

    if (!community) {
        notFound();
    }

    return (
        <div>
            <CommunityHeader community={community as any} />
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="grid grid-cols-12 gap-8">
                    <main className="col-span-12 md:col-span-8">
                        {/* Only show post creation for active community members */}
                        {(community as any).viewerRole && (community as any).viewerRole !== 'pending' ? (
                            <CreatePost communityId={community._id} />
                        ) : (
                            <div className="rounded-lg border bg-card p-4 mb-4 text-center">
                                <p className="text-sm text-muted-foreground">
                                    {(community as any).viewerRole === 'pending'
                                        ? 'Your membership is pending approval. You can post once approved.'
                                        : 'Join this community to create posts.'}
                                </p>
                            </div>
                        )}
                        <CommunityPostFeed communityId={community._id} />
                    </main>
                    <aside className="hidden md:block md:col-span-4">
                        <div className="sticky top-24 space-y-4">
                            <div className="rounded-lg border bg-card p-4">
                                <h3 className="font-bold text-lg">About Community</h3>
                                <p className="text-sm text-muted-foreground mt-2">{community.description}</p>
                            </div>
                             {community.rules && community.rules.length > 0 && (
                                <div className="rounded-lg border bg-card p-4">
                                    <h3 className="font-bold text-lg">Rules</h3>
                                    <ul className="list-decimal list-inside text-sm text-muted-foreground mt-2 space-y-1">
                                        {community.rules.map((rule, i) => <li key={i}>{rule}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}

export default function CommunityPage({ params }: PageProps) {
    return (
        <Suspense fallback={<div>Loading community...</div>}>
            <CommunityPageContent slug={params.slug} />
        </Suspense>
    );
}
