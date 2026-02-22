'use client';

import type { Doc } from '@/convex/_generated/dataModel';
import Link from 'next/link';
import { Hash } from 'lucide-react';

type Hashtag = Doc<'hashtags'>;

type Props = {
    hashtag: Hashtag;
};

export function HashtagCard({ hashtag }: Props) {
    return (
        <Link href={`/hashtag/${hashtag.tag}`} className="block p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
                <Hash className="h-6 w-6 text-primary" />
                <div>
                    <p className="font-bold text-lg">#{hashtag.tag}</p>
                    <p className="text-sm text-muted-foreground">{hashtag.postCount} posts</p>
                </div>
            </div>
        </Link>
    );
}
