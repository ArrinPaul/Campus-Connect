'use client';

import { useQuery, useConvexAuth } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { PostCard } from './PostCard';
import type { FeedItem } from './types';

export function FeedList() {
    const { isAuthenticated } = useConvexAuth();
    const result = useQuery(api.posts.getFeedPosts, isAuthenticated ? {} : 'skip');
    const posts = result?.posts ?? [];

    if (!result || posts.length === 0) {
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

