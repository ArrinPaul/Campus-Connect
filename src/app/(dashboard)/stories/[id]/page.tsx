'use client';

import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@/lib/api';
import { useUser } from '@/lib/auth/client';
import { api } from '@/lib/api';
import type { Id } from '@/lib/api';
import { notFound, useRouter } from 'next/navigation';
import { X, ArrowLeft, ArrowRight, Eye, Trash2, Pause, Play } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const DEFAULT_STORY_DURATION_MS = 5000;

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
 const { isSignedIn, isLoaded } = useUser();
 const isAuthenticated = isSignedIn ?? false;
 const story = useQuery(api.stories.getStoryById, isAuthenticated ? { storyId } : 'skip');
 const activeStories = useQuery(api.stories.getActiveStories, isAuthenticated ? {} : 'skip');
 const viewStory = useMutation(api.stories.viewStory);
 const deleteStory = useMutation(api.stories.deleteStory);
 const currentUser = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : 'skip');

 const [progress, setProgress] = useState(0);
 const [isPaused, setIsPaused] = useState(false);
 const progressBarIntervalRef = useRef<NodeJS.Timeout | null>(null);
 const videoRef = useRef<HTMLVideoElement>(null);
 const [durationMs, setDurationMs] = useState(DEFAULT_STORY_DURATION_MS);
 
 // Derived states
 const isVideo = story?.mediaUrl ? /\.(mp4|webm|ogg|mov)$/i.test(story.mediaUrl) : false;
 const currentIndex = activeStories?.findIndex((s: any) => s._id === storyId) ?? -1;

 const navigateTo = useCallback((dir: 'prev' | 'next') => {
 if (!activeStories || currentIndex === -1) {
 router.back();
 return;
 }
 const nextIndex = dir === 'next' ? currentIndex + 1 : currentIndex - 1;
 if (nextIndex >= 0 && nextIndex < activeStories.length) {
 router.replace(`/stories/${activeStories[nextIndex]._id}`);
 } else {
 router.back();
 }
 }, [activeStories, currentIndex, router]);

 const startProgressBar = useCallback(() => {
 if (progressBarIntervalRef.current) clearInterval(progressBarIntervalRef.current);
 const intervalMs = 50;
 
 progressBarIntervalRef.current = setInterval(() => {
 if (isPaused) return;
 
 setProgress(prev => {
 const newProgress = prev + (intervalMs / durationMs) * 100;
 if (newProgress >= 100) {
 if (progressBarIntervalRef.current) clearInterval(progressBarIntervalRef.current);
 navigateTo('next');
 return 100;
 }
 return newProgress;
 });
 }, intervalMs);
 }, [durationMs, isPaused, navigateTo]);

 useEffect(() => {
 if (story && isAuthenticated) {
 viewStory({ storyId }).catch(console.error);
 setProgress(0);
 if (!isVideo) {
 setDurationMs(DEFAULT_STORY_DURATION_MS);
 startProgressBar();
 }
 }
 return () => {
 if (progressBarIntervalRef.current) clearInterval(progressBarIntervalRef.current);
 };
 }, [storyId, isAuthenticated, isVideo, story, startProgressBar, viewStory]);
 
 useEffect(() => {
 // Sync video play/pause
 if (videoRef.current) {
 if (isPaused) videoRef.current.pause();
 else videoRef.current.play().catch(console.error);
 }
 }, [isPaused]);

 const handleVideoTimeUpdate = () => {
 if (!videoRef.current || isPaused) return;
 const current = videoRef.current.currentTime;
 const total = videoRef.current.duration;
 if (total > 0) {
 setProgress((current / total) * 100);
 }
 };
 
 const handleVideoEnded = () => {
 setProgress(100);
 navigateTo('next');
 };
 
 const handleVideoLoadedMetadata = () => {
 if (videoRef.current && videoRef.current.duration) {
 setDurationMs(videoRef.current.duration * 1000);
 }
 };

 const handleDelete = async () => {
 if (!story || !window.confirm("Are you sure you want to delete this story?")) return;
 try {
 await deleteStory({ storyId: story._id });
 toast.success("Story deleted!");
 router.push('/stories');
 } catch (error) {
 toast.error("Failed to delete story.", { description: (error as Error).message });
 }
 };

 if (story === undefined || activeStories === undefined) {
 return <StoryViewerSkeleton />;
 }

 if (story === null) {
 notFound();
 }

 const isOwnStory = currentUser?._id === story.authorId;

 return (
 <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black select-none">
 {/* Progress bar */}
 <div className="absolute top-0 left-0 right-0 z-20 p-2 pt-safe-top flex gap-1">
 {activeStories.map((s: any, idx: number) => (
 <div key={s._id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
 <div 
 className="h-full bg-white rounded-full transition-all duration-75 ease-linear" 
 style={{ 
 width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%' 
 }} 
 />
 </div>
 ))}
 </div>

 {/* Header Actions */}
 <div className="absolute top-8 left-0 right-0 z-20 flex justify-between px-4">
 <Link
 href={`/profile/${story.authorId}`}
 className="flex items-center gap-2"
 >
 <div className="h-9 w-9 rounded-full overflow-hidden ring-2 ring-white/50">
 {story.author?.profilePicture ? (
 <Image src={story.author.profilePicture} alt={story.author.name || ''} width={36} height={36} className="h-full w-full object-cover" />
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
 
 <div className="flex items-center gap-2">
 <button
 onClick={() => setIsPaused(!isPaused)}
 className="rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition-colors"
 aria-label={isPaused ?"Play" :"Pause"}
 >
 {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
 </button>
 <button
 onClick={() => router.push('/')}
 className="rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition-colors"
 aria-label="Close stories"
 >
 <X className="h-5 w-5" />
 </button>
 </div>
 </div>

 {/* Story Content & Tap Zones */}
 <div 
 className="absolute inset-0 flex items-center justify-center bg-black/90" 
 style={{ backgroundColor: story.backgroundColor || '#000' }}
 onPointerDown={() => setIsPaused(true)}
 onPointerUp={() => setIsPaused(false)}
 onPointerLeave={() => setIsPaused(false)}
 >
 {/* Left Tap Zone */}
 <div className="absolute left-0 top-0 bottom-0 w-1/3 z-10" onClick={(e) => { e.stopPropagation(); navigateTo('prev'); }} />
 
 {/* Right Tap Zone */}
 <div className="absolute right-0 top-0 bottom-0 w-2/3 z-10" onClick={(e) => { e.stopPropagation(); navigateTo('next'); }} />

 {story.mediaUrl ? (
 isVideo ? (
 <video 
 ref={videoRef}
 src={story.mediaUrl}
 className="h-full w-full object-contain"
 autoPlay
 playsInline
 muted={false}
 onTimeUpdate={handleVideoTimeUpdate}
 onEnded={handleVideoEnded}
 onLoadedMetadata={handleVideoLoadedMetadata}
 />
 ) : (
 <Image src={story.mediaUrl} alt="Story content" fill className="object-contain" priority />
 )
 ) : (
 <div className="flex items-center justify-center p-10 text-center pointer-events-none z-0">
 <p className="text-white font-semibold text-3xl leading-snug break-words max-w-sm" style={{ textShadow:"0 2px 8px rgba(0,0,0,0.6)" }}>
 {story.content}
 </p>
 </div>
 )}
 </div>

 {/* Bottom Actions (if own story) */}
 {isOwnStory && (
 <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-6 text-white">
 <div className="flex items-center gap-1.5 text-sm bg-black/40 px-3 py-1.5 rounded-full">
 <Eye className="h-4 w-4" /> {story.viewCount} Views
 </div>
 <button onClick={handleDelete} className="flex items-center gap-1.5 text-sm hover:text-red-400 bg-black/40 px-3 py-1.5 rounded-full transition-colors">
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
