'use client';

import React, { Suspense } from 'react';
import { useQuery } from '@/lib/api';
import { api } from '@/lib/api';
import { notFound } from 'next/navigation';
import { CommunityHeader } from '../../../(components)/communities/CommunityHeader';
import { CommunityPostFeed } from '../../../(components)/communities/CommunityPostFeed';
import { CreatePost } from '../../../(components)/feed/CreatePost';
import { Section } from '@/components/ui/Section';

type PageProps = {
 params: {
 slug: string;
 };
};

function CommunityPageContent({ slug }: { slug: string }) {
 const community = useQuery(api.communities.getCommunityBySlug, { slug });

 if (community === undefined) {
 return (
 <div className="w-full bg-canvas min-h-screen">
 <div className="h-80 w-full bg-canvas animate-pulse" />
 <div className="max-w-4xl mx-auto px-4 md:px-0 py-12 space-y-8">
 <div className="h-40 w-40 rounded-lg bg-canvas animate-pulse shadow-sm" />
 <div className="h-12 w-1/3 bg-canvas animate-pulse rounded" />
 <div className="h-4 w-1/2 bg-canvas animate-pulse rounded" />
 </div>
 </div>
 );
 }

 if (!community) {
 notFound();
 }

 const viewerRole = (community as any).viewerRole;
 const canPost = viewerRole && viewerRole !== 'pending';

 return (
 <div className="w-full min-h-screen bg-canvas">
 <CommunityHeader community={community as any} />
 
 <main className="w-full flex flex-col items-center py-lg md:py-xl">
 <div className="w-full max-w-2xl px-4 md:px-0 space-y-lg">
 {/* Post Creation Area */}
 {canPost ? (
 <CreatePost communityId={community._id} />
 ) : (
 <div className="rounded-lg border border-hairline bg-canvas/30 p-xl text-center">
 <h3 className="font-semibold text-ink">
 {viewerRole === 'pending'
 ? 'Membership Pending'
 : 'Connect with this Community'}
 </h3>
 <p className="text-caption text-slate mt-2 max-w-xs mx-auto">
 {viewerRole === 'pending'
 ? 'Your request is being reviewed by the moderators.'
 : 'Join this community to share your thoughts and participate in discussions.'}
 </p>
 </div>
 )}

 {/* Community Feed */}
 <div className="w-full">
 <div className="text-fine-print text-slate font-bold uppercase tracking-widest mb-md border-b border-hairline pb-2">
 Recent Activity
 </div>
 <CommunityPostFeed communityId={community._id} />
 </div>
 </div>
 </main>
 </div>
 );
}

export default function CommunityPage({ params }: PageProps) {
 return (
 <Suspense fallback={
 <div className="flex items-center justify-center min-h-screen bg-canvas">
 <div className="animate-pulse text-ink/30 font-display text-2xl">Loading community...</div>
 </div>
 }>
 <CommunityPageContent slug={params.slug} />
 </Suspense>
 );
}
