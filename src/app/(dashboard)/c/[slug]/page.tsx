'use client';

import React, { Suspense } from 'react';
import { useQuery } from '@/lib/api';
import { api } from '@/lib/api';
import { notFound } from 'next/navigation';
import { CommunityHeader } from '../../../(components)/communities/CommunityHeader';
import { CommunityPostFeed } from '../../../(components)/communities/CommunityPostFeed';
import { PostComposer } from '@/components/posts/PostComposer';
import { Globe } from 'lucide-react';
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
 
   <main className="w-full flex justify-center py-6">
   <div className="w-full max-w-[1024px] px-4 md:px-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
    
    {/* Left Column: About */}
    <div className="col-span-1 space-y-4">
      <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
        <h2 className="text-[17px] font-bold text-foreground mb-3">About</h2>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{community.description}</p>
        <div className="flex items-center gap-2 text-sm text-foreground mb-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">{community.type === 'public' ? 'Public' : 'Private'} Group</span>
        </div>
        <div className="text-xs text-muted-foreground ml-6">
          {community.type === 'public' ? 'Anyone can see who is in the group and what they post.' : 'Only members can see who is in the group and what they post.'}
        </div>
      </div>
    </div>

    {/* Right Column: Feed */}
    <div className="col-span-1 lg:col-span-2 space-y-4">
      {/* Post Creation Area */}
      {canPost ? (
        <PostComposer communityId={community._id} />
      ) : (
        <div className="rounded-lg border border-border bg-card p-8 text-center shadow-sm mb-4">
          <h3 className="font-bold text-foreground">
            {viewerRole === 'pending'
            ? 'Membership Pending'
            : 'Connect with this Community'}
          </h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
            {viewerRole === 'pending'
            ? 'Your request is being reviewed by the moderators.'
            : 'Join this community to participate in discussions and share posts.'}
          </p>
        </div>
      )}

      {/* Feed Section */}
      <div className="w-full">
        <CommunityPostFeed communityId={community._id} />
      </div>
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
 <div className="animate-pulse text-foreground/30 font-display text-2xl">Loading community...</div>
 </div>
 }>
 <CommunityPageContent slug={params.slug} />
 </Suspense>
 );
}


