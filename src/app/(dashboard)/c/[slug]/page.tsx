import React, { Suspense } from 'react';
import { fetchQuery } from 'convex/nextjs';
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

async function CommunityPageContent({ slug }: { slug: string }) {
    const community = await fetchQuery(api.communities.getCommunity, { slug });

    if (!community) {
        notFound();
    }

    return (
        <div>
            <CommunityHeader community={community as any} />
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="grid grid-cols-12 gap-8">
                    <main className="col-span-12 md:col-span-8">
                        {/* Pass communityId to CreatePost so new posts are associated with this community */}
                        <CreatePost communityId={community._id} />
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
