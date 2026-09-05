'use client';

import { useQuery } from '@/lib/api';
import { api } from '@/lib/api';
import type { Id } from '@/lib/api';
import { PostCard } from '@/components/posts/PostCard';

export function UserPostList({ userId }: { userId: Id<'users'> }) {
    const postsData = useQuery(api.posts.getUserPosts, userId ? { userId } : "skip");

    if (postsData === undefined) {
        return (
             <div className="space-y-4 max-w-xl mx-auto">
                <div className="rounded-lg border border-border bg-card p-4 animate-pulse">
                    <div className="space-y-2">
                        <div className="h-4 w-full bg-muted rounded" />
                        <div className="h-4 w-5/6 bg-muted rounded" />
                    </div>
                </div>
            </div>
        );
    }

    const posts = Array.isArray(postsData) ? postsData : (postsData as any)?.posts || [];

    if (posts.length === 0) {
        return (
            <div className="rounded-lg border border-border bg-card p-8 text-center mt-4 max-w-xl mx-auto">
                <h3 className="text-lg font-semibold text-foreground">No posts yet</h3>
                <p className="text-muted-foreground text-sm mt-1">
                    No posts to display.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4 mt-4 max-w-xl mx-auto">
            {posts.map((post: any, idx: number) => {
                if (!post) return null;
                const postId = post._id || post.id || `user-post-${idx}`;
                const author = post.author || {
                    _id: post.author_id || post.authorId || userId,
                    name: 'User',
                    role: 'Student'
                };
                return (
                    <PostCard
                        key={postId}
                        post={{
                            ...post,
                            _id: postId,
                            authorId: author._id || author.id,
                        }}
                        author={author}
                    />
                );
            })}
        </div>
    );
}
