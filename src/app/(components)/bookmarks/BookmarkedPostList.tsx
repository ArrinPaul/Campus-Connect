'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { PostCard } from '../../(components)/feed/PostCard';

export function BookmarkedPostList() {
    const bookmarksData = useQuery(api.bookmarks.getBookmarks, {});

    if (bookmarksData === undefined) {
        return <div className="text-center py-16">Loading bookmarks...</div>
    }

    const bookmarks = bookmarksData.bookmarks;

    if (bookmarks.length === 0) {
        return (
            <div className="text-center py-16">
                <h3 className="text-lg font-semibold">No bookmarks yet</h3>
                <p className="text-muted-foreground mt-2">
                    Save posts to find them here later.
                </p>
            </div>
        );
    }
    
    // Transform the bookmark data into the FeedItem format that PostCard expects
    const feedItems = bookmarks.map(bookmark => ({
        type: 'post' as const,
        _id: bookmark.post._id,
        createdAt: bookmark.post.createdAt,
        post: {
            ...bookmark.post,
            author: bookmark.author,
        },
    }));

    return (
        <div className="space-y-4">
            {feedItems.map(item => (
                <PostCard key={item._id} item={item as any} />
            ))}
        </div>
    );
}
