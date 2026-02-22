'use client';

import { Suspense } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { notFound } from 'next/navigation';
import { ArrowLeft, Hash } from 'lucide-react';
import Link from 'next/link';
import { PostCard } from '../../(components)/feed/PostCard';
import { FeedItem } from '../../(components)/feed/types';

type PageProps = {
    params: {
        tag: string;
    };
};

const HashtagPostsSkeleton = () => (
    <div className="space-y-4">
        <div className="h-24 w-full bg-muted/50 rounded-lg animate-pulse" />
        <div className="border rounded-lg bg-card p-4 h-32 animate-pulse" />
        <div className="border rounded-lg bg-card p-4 h-32 animate-pulse" />
    </div>
);

function HashtagPageContent({ tag }: { tag: string }) {
    const { posts, hashtag } = useQuery(api.hashtags.getPostsByHashtag, { tag }) || { posts: [], hashtag: null };

    if (posts === undefined && hashtag === undefined) {
        return <HashtagPostsSkeleton />;
    }

    if (hashtag === null && posts === null) {
        notFound();
    }
    
    return (
        <div className="max-w-xl mx-auto py-8 px-4">
            <Link href="/explore" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Explore
            </Link>

            <div className="bg-card border rounded-lg p-6 mb-8">
                <div className="flex items-center gap-4">
                    <Hash className="h-10 w-10 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold">#{hashtag?.tag}</h1>
                        <p className="text-sm text-muted-foreground">{hashtag?.postCount} posts</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {posts.map(post => (
                    <PostCard key={post._id} item={{ type: 'post', post: post as any, _id: post._id, createdAt: post.createdAt }} />
                ))}
            </div>

            {posts.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                    <h3 className="text-lg font-semibold">No posts with this hashtag yet</h3>
                    <p className="text-sm mt-2">Be the first to use #{hashtag?.tag}!</p>
                </div>
            )}
        </div>
    );
}

export default function HashtagPage({ params }: PageProps) {
    return (
        <Suspense fallback={<HashtagPostsSkeleton />}>
            <HashtagPageContent tag={params.tag} />
        </Suspense>
    );
}
