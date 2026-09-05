'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@/lib/api';
import { api } from '@/lib/api';
import { PostCard } from '../../(components)/feed/PostCard';
import { Bookmark, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BookmarkedPostList() {
  const bookmarksData = useQuery(api.bookmarks.getBookmarks, {});

  if (bookmarksData === undefined) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="w-full bg-card border border-border rounded-2xl p-5 space-y-3 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-3 w-20 bg-muted rounded" />
              </div>
            </div>
            <div className="h-14 bg-muted rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  let bookmarks: any[] = [];
  if (Array.isArray(bookmarksData)) {
    bookmarks = bookmarksData;
  } else if (bookmarksData && Array.isArray(bookmarksData.bookmarks)) {
    bookmarks = bookmarksData.bookmarks;
  }

  if (!bookmarks || bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-card border border-border rounded-2xl shadow-sm">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
          <Bookmark className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold text-foreground">No saved posts yet</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Bookmark study notes, research papers, questions, and important campus announcements to read them here anytime.
        </p>
        <Button asChild className="mt-6 gap-2">
          <Link href="/feed">
            <Sparkles className="h-4 w-4" />
            Explore Campus Feed
          </Link>
        </Button>
      </div>
    );
  }

  // Transform bookmark data into the FeedItem format
  const feedItems = bookmarks
    .filter((bookmark: any) => bookmark && bookmark.post)
    .map((bookmark: any) => ({
      type: 'post' as const,
      _id: bookmark.post.id,
      createdAt: bookmark.post.created_at,
      post: bookmark.post,
    }));

  return (
    <div className="space-y-4">
      {feedItems.map((item: any) => (
        <PostCard key={item._id} item={item as any} />
      ))}
    </div>
  );
}
