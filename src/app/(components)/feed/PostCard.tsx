'use client';

import { Repeat2 } from 'lucide-react';
import { PostCard as InteractivePostCard } from '@/components/posts/PostCard';
import { FeedItem } from './types';

type PostCardProps = {
  item: FeedItem;
};

/**
 * Thin wrapper that adapts the FeedItem shape to the interactive PostCard props.
 * All 7 pages import from this file — by delegating to the interactive PostCard,
 * every post in the app now supports reactions, comments, bookmarks, reposts, etc.
 */
export function PostCard({ item }: PostCardProps) {
  const { post } = item;
  const { author, ...postData } = post;

  if (!author) return null;

  return (
    <div>
      {item.type === 'repost' && item.reposter && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 ml-8">
          <Repeat2 className="h-4 w-4" />
          <span>{item.reposter.name} reposted</span>
        </div>
      )}
      <InteractivePostCard post={postData as any} author={author as any} />
    </div>
  );
}
