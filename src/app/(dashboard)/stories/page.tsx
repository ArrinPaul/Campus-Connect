'use client';

import { Suspense, useState } from 'react';
import { useQuery } from '@/lib/api';
import { api } from '@/lib/api';
import { StoryPreviewCard } from '../../(components)/stories/StoryPreviewCard';
import { StoryComposer } from '@/components/stories/StoryComposer';
import { Camera, Loader2, Plus } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

const StoriesPageSkeleton = () => (
 <div className="max-w-4xl mx-auto py-8 px-4">
 <h1 className="text-3xl font-bold mb-6">Stories</h1>
 <div className="flex flex-wrap gap-4">
 {[...Array(5)].map((_, i) => (
 <div key={i} className="flex flex-col items-center gap-2">
 <div className="h-16 w-16 rounded-full bg-muted/50 animate-pulse" />
 <div className="h-3 w-12 rounded-md bg-muted/50 animate-pulse" />
 </div>
 ))}
 </div>
 </div>
);

function StoriesPageContent() {
 const stories = useQuery(api.stories.getActiveStories, {});
 const [composerOpen, setComposerOpen] = useState(false);

 if (stories === undefined) {
 return <StoriesPageSkeleton />;
 }

 if (stories.length === 0) {
 return (
 <div className="max-w-4xl mx-auto py-8 px-4">
 <div className="flex justify-between items-center mb-6">
 <h1 className="text-3xl font-bold">Stories</h1>
 <button onClick={() => setComposerOpen(true)} className="flex items-center gap-2 h-10 py-2 px-4 active:scale-[0.98] bg-primary text-on-primary hover:bg-primary/90 rounded-md text-sm font-semibold">
 <Plus className="h-4 w-4" /> Create Story
 </button>
 </div>
 <EmptyState
 icon={Camera}
 title="No stories available"
 description="Follow more users or create your own story!"
 />
 <StoryComposer isOpen={composerOpen} onClose={() => setComposerOpen(false)} />
 </div>
 );
 }

 return (
 <div className="max-w-4xl mx-auto py-8 px-4">
 <div className="flex justify-between items-center mb-6">
 <h1 className="text-3xl font-bold">Stories</h1>
 <button onClick={() => setComposerOpen(true)} className="flex items-center gap-2 h-10 py-2 px-4 active:scale-[0.98] bg-primary text-on-primary hover:bg-primary/90 rounded-md text-sm font-semibold">
 <Plus className="h-4 w-4" /> Create Story
 </button>
 </div>
 <div className="flex flex-wrap gap-4">
 {stories.map((story: any) => (
 <StoryPreviewCard key={story._id} story={story as any} />
 ))}
 </div>
 <StoryComposer isOpen={composerOpen} onClose={() => setComposerOpen(false)} />
 </div>
 );
}

export default function StoriesPage() {
 return (
 <Suspense fallback={<StoriesPageSkeleton />}>
 <StoriesPageContent />
 </Suspense>
 );
}
