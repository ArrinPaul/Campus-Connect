'use client';

import type { Doc } from '@/convex/_generated/dataModel';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Manually defining type based on getStories query
type Story = Doc<'stories'> & {
    viewed: boolean;
    author: Doc<'users'> | null;
};

type Props = {
    story: Story;
};

export function StoryPreviewCard({ story }: Props) {
    const authorName = story.author?.name || 'Unknown';
    const authorAvatar = story.author?.profilePicture;

    return (
        <Link href={`/stories/${story._id}`} className="flex flex-col items-center gap-2">
            <div className={cn(
                "relative h-16 w-16 rounded-full p-[2px]",
                story.viewed ? 'border-2 border-muted' : 'border-2 border-primary'
            )}>
                <div className="h-full w-full rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {authorAvatar ? (
                        <img src={authorAvatar} alt={authorName} className="h-full w-full object-cover" />
                    ) : (
                        <span className="text-xl font-bold text-primary-foreground">{authorName.charAt(0)}</span>
                    )}
                </div>
            </div>
            <p className="text-xs text-center truncate w-20">{authorName}</p>
        </Link>
    );
}
