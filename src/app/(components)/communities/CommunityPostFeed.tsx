'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { PostCard } from '../../(components)/feed/PostCard';

export function CommunityPostFeed({ communityId }: { communityId: Id<'communities'> }) {
    const posts = useQuery(api.communities.getCommunityPosts, { communityId });

    if (posts === undefined) {
        return (
            <div className="space-y-4 mt-8">
                 <div className="rounded-lg border bg-card p-4 animate-pulse h-32" />
                 <div className="rounded-lg border bg-card p-4 animate-pulse h-32" />
            </div>
        )
    }

    if (posts.length === 0) {
        return (
             <div className="rounded-lg border bg-card p-8 text-center mt-8">
                <h3 className="text-lg font-semibold">No posts in this community yet</h3>
                <p className="text-muted-foreground mt-2">
                    Be the first one to post!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4 mt-8">
            {posts.map(post => (
                <PostCard key={post._id} item={{ type: 'post', post: post as any, _id: post._id, createdAt: post.createdAt }} />
            ))}
        </div>
    );
}
