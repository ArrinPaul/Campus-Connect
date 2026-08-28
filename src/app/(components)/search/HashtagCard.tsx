'use client';

import type { Doc } from '@/lib/api';
import Link from 'next/link';
import { Hash } from 'lucide-react';

type Hashtag = Doc<'hashtags'>;

type Props = {
    hashtag: Hashtag;
};

export function HashtagCard({ hashtag }: Props) {
    return (
        <Link href={`/hashtag/${hashtag.tag}`} className="block p-4 border border-border rounded-lg bg-card hover:bg-surface-hover transition-colors shadow-sm">
            <div className="flex items-center gap-3">
                <Hash className="h-8 w-8 text-primary opacity-80" />
                <div>
                    <p className="font-bold text-[17px] text-foreground leading-tight">#{hashtag.tag}</p>
                    <p className="text-xs text-muted-foreground mt-1">{hashtag.postCount} posts</p>
                </div>
            </div>
        </Link>
    );
}

