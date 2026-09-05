'use client';

import { useQuery } from '@/lib/api';
import { api } from '@/lib/api';
import type { Id } from '@/lib/api';
import { PostCard } from '@/components/posts/PostCard';
import { MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useState } from 'react';

type ActivityFilter = 'all' | 'posts' | 'comments';

export function UserActivityFeed({ userId }: { userId: Id<'users'> }) {
    const [filter, setFilter] = useState<ActivityFilter>('all');

    const postsData = useQuery(api.posts.getUserPosts, userId ? { userId, limit: 20 } : "skip");
    const commentsData = useQuery(api.comments.getCommentsByUser, userId ? { userId, limit: 20 } : "skip");

    const isLoading = postsData === undefined || commentsData === undefined;

    if (isLoading) {
        return (
            <div className="space-y-4 mt-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="rounded-lg border border-border bg-card p-4 animate-pulse">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-8 w-8 rounded-full bg-muted" />
                            <div className="h-4 w-32 bg-muted rounded" />
                        </div>
                        <div className="space-y-2">
                            <div className="h-4 w-full bg-muted rounded" />
                            <div className="h-4 w-3/4 bg-muted rounded" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    const posts = Array.isArray(postsData) ? postsData : (postsData as any)?.posts || [];
    const comments = Array.isArray(commentsData) ? commentsData : (commentsData as any)?.comments || [];

    type ActivityItem = {
        type: 'post' | 'comment';
        timestamp: number;
        data: any;
    };

    const activityItems: ActivityItem[] = [];

    if (filter === 'all' || filter === 'posts') {
        for (const post of posts) {
            if (!post) continue;
            activityItems.push({
                type: 'post',
                timestamp: new Date(post.createdAt || post.created_at || Date.now()).getTime(),
                data: post,
            });
        }
    }

    if (filter === 'all' || filter === 'comments') {
        for (const comment of comments) {
            if (!comment) continue;
            activityItems.push({
                type: 'comment',
                timestamp: new Date(comment.createdAt || comment.created_at || Date.now()).getTime(),
                data: comment,
            });
        }
    }

    activityItems.sort((a, b) => b.timestamp - a.timestamp);

    const filterButtons: { label: string; value: ActivityFilter }[] = [
        { label: 'All', value: 'all' },
        { label: 'Posts', value: 'posts' },
        { label: 'Comments', value: 'comments' },
    ];

    return (
        <div className="mt-4">
            {/* Filter Buttons */}
            <div className="flex gap-2 mb-4">
                {filterButtons.map(({ label, value }) => (
                    <button
                        key={value}
                        onClick={() => setFilter(value)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                            filter === value
                                ? 'bg-primary text-white'
                                : 'bg-card text-muted-foreground border border-border hover:bg-card hover:text-foreground'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Activity Items */}
            {activityItems.length === 0 ? (
                <div className="rounded-lg border border-border bg-card p-8 text-center">
                    <h3 className="text-lg font-semibold text-foreground">No activity yet</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                        Activity will appear here when this user posts or comments.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {activityItems.map((item, idx) => {
                        if (item.type === 'post') {
                            const post = item.data;
                            const postId = post._id || post.id || `act-post-${idx}`;
                            const author = post.author || {
                                _id: post.author_id || post.authorId || userId,
                                name: 'User',
                                role: 'Student'
                            };
                            return (
                                <PostCard
                                    key={`post-${postId}`}
                                    post={{
                                        ...post,
                                        _id: postId,
                                        authorId: author._id || author.id,
                                    }}
                                    author={author}
                                />
                            );
                        }

                        if (item.type === 'comment') {
                            const comment = item.data;
                            const commentId = comment._id || comment.id || `act-comm-${idx}`;
                            return (
                                <div key={`comment-${commentId}`} className="rounded-lg border border-border bg-card p-4">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                        <MessageSquare className="h-3.5 w-3.5" />
                                        <span>Commented on a post</span>
                                        <span>•</span>
                                        <span suppressHydrationWarning>{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</span>
                                    </div>
                                    <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-3">
                                        {comment.content}
                                    </p>
                                    <Link
                                        href={`/post/${comment.postId || comment.post_id}`}
                                        className="text-xs text-primary font-semibold hover:underline mt-2 inline-block"
                                    >
                                        View post →
                                    </Link>
                                </div>
                            );
                        }

                        return null;
                    })}
                </div>
            )}
        </div>
    );
}
