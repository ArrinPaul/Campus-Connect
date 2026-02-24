'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { PostCard } from '../../(components)/feed/PostCard';
import type { FeedItem } from '../../(components)/feed/types';
import { MessageSquare, Heart, Repeat2, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useState } from 'react';

type ActivityFilter = 'all' | 'posts' | 'comments' | 'likes';

export function UserActivityFeed({ userId }: { userId: Id<'users'> }) {
    const [filter, setFilter] = useState<ActivityFilter>('all');

    const posts = useQuery(api.posts.getPostsByUserId, { userId, limit: 20 });
    const comments = useQuery(api.comments.getCommentsByUser, { userId, limit: 20 });

    const isLoading = posts === undefined || comments === undefined;

    if (isLoading) {
        return (
            <div className="space-y-4 mt-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="rounded-lg border bg-card p-4 animate-pulse">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-8 w-8 rounded-full bg-muted/50" />
                            <div className="h-4 w-32 bg-muted/50 rounded" />
                        </div>
                        <div className="space-y-2">
                            <div className="h-4 w-full bg-muted/50 rounded" />
                            <div className="h-4 w-3/4 bg-muted/50 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Build unified activity items
    type ActivityItem = {
        type: 'post' | 'comment';
        timestamp: number;
        data: any;
    };

    const activityItems: ActivityItem[] = [];

    if (filter === 'all' || filter === 'posts') {
        for (const post of posts || []) {
            activityItems.push({
                type: 'post',
                timestamp: post.createdAt,
                data: post,
            });
        }
    }

    if (filter === 'all' || filter === 'comments') {
        for (const comment of comments || []) {
            activityItems.push({
                type: 'comment',
                timestamp: comment.createdAt,
                data: comment,
            });
        }
    }

    // Sort chronologically descending
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
                        className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                            filter === value
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Activity Items */}
            {activityItems.length === 0 ? (
                <div className="rounded-lg border bg-card p-8 text-center">
                    <h3 className="text-lg font-semibold">No activity yet</h3>
                    <p className="text-muted-foreground mt-2">
                        Activity will appear here when this user posts or comments.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {activityItems.map((item) => {
                        if (item.type === 'post') {
                            const feedItem: FeedItem = {
                                type: 'post',
                                _id: item.data._id,
                                createdAt: item.data.createdAt,
                                post: item.data as any,
                            };
                            return <PostCard key={`post-${item.data._id}`} item={feedItem} />;
                        }

                        if (item.type === 'comment') {
                            return (
                                <div key={`comment-${item.data._id}`} className="rounded-lg border bg-card p-4">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                        <MessageSquare className="h-3.5 w-3.5" />
                                        <span>Commented on a post</span>
                                        <span>•</span>
                                        <span>{formatDistanceToNow(new Date(item.data.createdAt), { addSuffix: true })}</span>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap line-clamp-3">
                                        {item.data.content}
                                    </p>
                                    <Link
                                        href={`/post/${item.data.postId}`}
                                        className="text-xs text-primary hover:underline mt-2 inline-block"
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
