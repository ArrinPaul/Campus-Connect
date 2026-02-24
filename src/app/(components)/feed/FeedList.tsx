'use client';

import { useQuery, useConvexAuth } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { PostCard } from './PostCard';
import { FeedSkeleton } from './skeletons';
import type { FeedItem } from './types';

export function FeedList() {
    const { isLoading, isAuthenticated } = useConvexAuth();
    const result = useQuery(api.posts.getFeedPosts, isAuthenticated ? {} : 'skip');
    const posts = result?.posts ?? [];

    // Show skeleton while auth is loading or query is in flight
    if (isLoading || (isAuthenticated && result === undefined)) {
        return <FeedSkeleton />;
    }

    if (!isAuthenticated) {
        return (
            <div className="rounded-lg border bg-card p-8 text-center">
                <h3 className="text-lg font-semibold">Sign in to see your feed</h3>
                <p className="text-muted-foreground mt-2">
                    Create an account or sign in to start following people.
                </p>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="rounded-lg border bg-card p-8 text-center">
                <h3 className="text-lg font-semibold">Your feed is empty</h3>
                <p className="text-muted-foreground mt-2">
                    Follow some people or communities to get started!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {posts.map((post) => {
                if (!post) return null;
                const item: FeedItem = {
                    type: 'post',
                    _id: post._id,
                    createdAt: post.createdAt,
                    post: post as any,
                };
                return <PostCard key={post._id} item={item} />;
            })}
        </div>
    );
}
