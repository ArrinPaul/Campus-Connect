'use client';

import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { notFound, useRouter } from 'next/navigation';
import { X, ArrowLeft, ArrowRight, Eye, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const STORY_DURATION_MS = 5000; // 5 seconds per story

type PageProps = {
    params: {
        id: Id<'stories'>;
    };
};

const StoryViewerSkeleton = () => (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
        <p className="text-white mt-4">Loading story...</p>
    </div>
);

function StoryViewerContent({ storyId }: { storyId: Id<'stories'> }) {
    const router = useRouter();
    const story = useQuery(api.stories.getStoryById, { storyId });
    const viewStory = useMutation(api.stories.viewStory);
    const deleteStory = useMutation(api.stories.deleteStory);
    const currentUser = useQuery(api.users.getCurrentUser);

    const [progress, setProgress] = useState(0);
    const progressBarIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const startProgressBar = useCallback(() => {
        if (progressBarIntervalRef.current) clearInterval(progressBarIntervalRef.current);
        const startTime = Date.now();
        progressBarIntervalRef.current = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const newProgress = Math.min(100, (elapsed / STORY_DURATION_MS) * 100);
            setProgress(newProgress);
            if (elapsed >= STORY_DURATION_MS) {
                clearInterval(progressBarIntervalRef.current);
                // For now, just close the viewer when story ends.
                // In a real implementation, this would advance to the next story in the author's group.
                router.back(); 
            }
        }, 50);
    }, [router]);

    useEffect(() => {
        if (story) {
            viewStory({ storyId }).catch(console.error); // Record view
            setProgress(0);
            startProgressBar();
        }
        return () => {
            if (progressBarIntervalRef.current) clearInterval(progressBarIntervalRef.current);
        };
    }, [storyId, story, viewStory, startProgressBar]);

    const handleDelete = async () => {
        if (!story || !window.confirm("Are you sure you want to delete this story?")) return;
        try {
            await deleteStory({ storyId: story._id });
            toast.success("Story deleted!");
            router.push('/stories'); // Go back to stories list after deleting
        } catch (error) {
            toast.error("Failed to delete story.", { description: (error as Error).message });
        }
    };

    if (story === undefined) {
        return <StoryViewerSkeleton />;
    }

    if (story === null) {
        notFound();
    }

    const isOwnStory = currentUser?._id === story.authorId;

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black select-none">
            {/* Progress bar */}
            <div className="absolute top-0 left-0 right-0 z-10 p-2 pt-safe-top">
                <div className="h-1 w-full bg-white/30 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full" style={{ width: `${progress}%` }} />
                </div>
            </div>

            {/* Close Button */}
            <button
                onClick={() => router.back()}
                className="absolute top-8 right-4 z-10 rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition-colors"
                aria-label="Close stories"
            >
                <X className="h-5 w-5" />
            </button>

            {/* Author Info */}
            <Link
                href={`/profile/${story.authorId}`}
                className="absolute top-8 left-4 z-10 flex items-center gap-2"
            >
                <div className="h-9 w-9 rounded-full overflow-hidden ring-2 ring-white/50">
                    {story.author?.profilePicture ? (
                        <img src={story.author.profilePicture} alt={story.author.name || ''} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary text-sm font-bold text-white">
                            {story.author?.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <div>
                    <p className="text-sm font-semibold text-white leading-tight drop-shadow">
                        {story.author?.name}
                    </p>
                    <p className="text-xs text-white/70">
                        {formatDistanceToNow(new Date(story.createdAt), { addSuffix: true })}
                    </p>
                </div>
            </Link>

            {/* Story Content */}
            <div className="absolute inset-0 flex items-center justify-center p-4" style={{ backgroundColor: story.backgroundColor || '#111' }}>
                {story.mediaUrl ? (
                    // TODO: Handle video stories
                    <img src={story.mediaUrl} alt="Story content" className="max-h-full max-w-full object-contain" />
                ) : (
                    <div className="flex items-center justify-center p-10 text-center">
                        <p className="text-white font-semibold text-2xl leading-snug" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
                            {story.content}
                        </p>
                    </div>
                )}
            </div>

            {/* Navigation Buttons (Desktop) */}
            <div className="absolute inset-0 flex items-center justify-between px-4 z-0">
                <button
                    onClick={() => console.log('Previous story')} // Implement actual navigation later
                    className="hidden md:block rounded-full bg-white/20 p-3 text-white hover:bg-white/30 transition-colors"
                    aria-label="Previous story"
                >
                    <ArrowLeft className="h-6 w-6" />
                </button>
                <button
                    onClick={() => console.log('Next story')} // Implement actual navigation later
                    className="hidden md:block rounded-full bg-white/20 p-3 text-white hover:bg-white/30 transition-colors"
                    aria-label="Next story"
                >
                    <ArrowRight className="h-6 w-6" />
                </button>
            </div>

            {/* Bottom Actions (if own story) */}
            {isOwnStory && (
                <div className="absolute bottom-4 left-0 right-0 z-10 flex justify-center gap-4 text-white">
                    <div className="flex items-center gap-1 text-sm">
                        <Eye className="h-4 w-4" /> {story.viewCount}
                    </div>
                    <button onClick={handleDelete} className="flex items-center gap-1 text-sm hover:text-red-400">
                        <Trash2 className="h-4 w-4" /> Delete
                    </button>
                </div>
            )}
        </div>
    );
}

export default function StoryViewerPage({ params }: PageProps) {
    return (
        <Suspense fallback={<StoryViewerSkeleton />}>
            <StoryViewerContent storyId={params.id} />
        </Suspense>
    );
}
