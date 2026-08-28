'use client';

import React from 'react';
import { BookmarkedPostList } from '../../(components)/bookmarks/BookmarkedPostList';
import { Bookmark } from 'lucide-react';

export default function BookmarksPage() {
  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Bookmark className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Bookmarks</h1>
            <p className="text-xs text-muted-foreground">Your personal collection of saved posts and resources</p>
          </div>
        </div>
      </div>

      <BookmarkedPostList />
    </div>
  );
}
