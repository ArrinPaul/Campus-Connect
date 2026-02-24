'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { PostCard } from '../../(components)/feed/PostCard';
import { FeedItem } from '../../(components)/feed/types';
import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

const ExplorePostGridSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(9)].map((_, i) => (
            <div key={i} className="border rounded-lg bg-card p-4 h-64 animate-pulse" />
        ))}
    </div>
);

export function ExplorePostGrid() {
    const [posts, setPosts] = useState<FeedItem[]>([]);
    const [cursor, setCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Use raw result to distinguish "loading" (undefined) from "loaded empty" 
    const queryResult = useQuery(
        api.posts.getExplorePosts,
        hasMore ? { cursor: cursor || undefined, limit: 9 } : "skip"
    );
    
    const isInitialLoading = queryResult === undefined && posts.length === 0;

    useEffect(() => {
        // Don't process while query is still loading (undefined)
        if (queryResult === undefined) return;

        const { posts: newPosts, nextCursor, hasMore: newHasMore } = queryResult;
        
        if (isLoadingMore) {
            // Append new page to existing posts
            if (newPosts && newPosts.length > 0) {
                setPosts(prev => [...prev, ...newPosts.map(post => ({
                    type: 'post' as const,
                    _id: post._id,
                    createdAt: post.createdAt,
                    post: post as any,
                }))]);
            }
            setIsLoadingMore(false);
        } else if (cursor === null && posts.length === 0) {
            // Initial load
            setPosts(newPosts.map(post => ({
                type: 'post' as const,
                _id: post._id,
                createdAt: post.createdAt,
                post: post as any,
            })));
        }
        
        setCursor(nextCursor);
        setHasMore(newHasMore);
    }, [queryResult]); // eslint-disable-line react-hooks/exhaustive-deps

    const observerTargetRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!observerTargetRef.current || !hasMore || isLoadingMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
                    setIsLoadingMore(true);
                }
            },
            { threshold: 1.0 }
        );

        observer.observe(observerTargetRef.current);

        const target = observerTargetRef.current;
        return () => {
            observer.unobserve(target);
        };
    }, [hasMore, isLoadingMore]);

    if (isInitialLoading) {
        return <ExplorePostGridSkeleton />;
    }

    if (posts.length === 0) {
        return (
            <div className="text-center py-16">
                <h3 className="text-lg font-semibold">No posts to explore</h3>
                <p className="text-muted-foreground mt-2">
                    Start posting or check back later!
                </p>
            </div>
        );
    }
    
    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {posts.map(item => (
                    <PostCard key={item._id} item={item as any} />
                ))}
            </div>

            {hasMore && (
                <div className="flex justify-center mt-8" ref={observerTargetRef}>
                    {isLoadingMore && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
                </div>
            )}
        </div>
    );
}
