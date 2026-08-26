"use client";

import React from "react";
import Link from "next/link";
import { api, useQuery } from "@/lib/api";
import { Hash, TrendingUp } from "lucide-react";

interface HashtagItem {
  id: string;
  tag: string;
  post_count: number;
}

interface TrendingHashtagsProps {
  limit?: number;
  className?: string;
}

export function TrendingHashtags({ limit = 5, className = "" }: TrendingHashtagsProps) {
  const hashtags = useQuery<HashtagItem[]>(api.hashtags.getTrending, { limit });

  return (
    <div className={`rounded-xl border border-hairline bg-canvas p-4 shadow-sm ${className}`} data-testid="trending-hashtags-widget">
      <div className="flex items-center gap-2 pb-3 border-b border-hairline mb-3">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-ink text-sm">Trending on Campus</h3>
      </div>

      {hashtags === undefined ? (
        // Loading State
        <div className="space-y-2" data-testid="trending-loading">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center justify-between py-1.5">
              <div className="h-4 bg-surface-soft rounded w-24"></div>
              <div className="h-3 bg-surface-soft rounded w-12"></div>
            </div>
          ))}
        </div>
      ) : hashtags.length === 0 ? (
        // Empty State
        <div className="py-4 text-center text-xs text-charcoal" data-testid="trending-empty">
          No trending topics right now. Be the first to tag a post!
        </div>
      ) : (
        // Success List
        <div className="space-y-1.5" data-testid="trending-list">
          {hashtags.map((item) => (
            <Link
              key={item.id || item.tag}
              href={`/hashtag/${encodeURIComponent(item.tag)}`}
              className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-surface-soft transition-colors group"
            >
              <div className="flex items-center gap-1.5 text-sm font-medium text-ink group-hover:text-primary transition-colors">
                <Hash className="h-3.5 w-3.5 text-charcoal group-hover:text-primary" />
                <span>#{item.tag}</span>
              </div>
              <span className="text-xs text-charcoal font-normal">
                {item.post_count} {item.post_count === 1 ? "post" : "posts"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
