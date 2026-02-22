'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { PostCard } from './PostCard';
import { FeedItem } from './types';

export function FeedList() {
    // useQuery will suspend while fetching, so the parent Suspense boundary will catch it.
    const feedItems = useQuery(api.posts.getUnifiedFeed, {});

    if (!feedItems || feedItems.items.length === 0) {
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
            {feedItems.items.map((item) => (
                <PostCard key={`${item.type}-${item._id}`} item={item as FeedItem} />
            ))}
        </div>
    );
}
