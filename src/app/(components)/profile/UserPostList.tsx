'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { PostCard } from '../../(components)/feed/PostCard';
import type { FeedItem } from '../../(components)/feed/types';

export function UserPostList({ userId }: { userId: Id<'users'> }) {
    const posts = useQuery(api.posts.getPostsByUserId, { userId });

    if (posts === undefined) {
        return (
             <div className="space-y-4 max-w-xl mx-auto">
                <div className="rounded-lg border bg-card p-4 animate-pulse">
                    <div className="space-y-2">
                        <div className="h-4 w-full bg-muted/50" />
                        <div className="h-4 w-5/6 bg-muted/50" />
                    </div>
                </div>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="rounded-lg border bg-card p-8 text-center mt-8 max-w-xl mx-auto">
                <h3 className="text-lg font-semibold">No posts yet</h3>
                <p className="text-muted-foreground mt-2">
                    This user hasn&apos;t posted anything.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4 mt-8 max-w-xl mx-auto">
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

