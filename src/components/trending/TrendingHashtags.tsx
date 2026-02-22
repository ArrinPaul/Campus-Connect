"use client"

import Link from "next/link"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { TrendingUp, Hash } from "lucide-react"
import { getHashtagDisplay } from "@/lib/hashtag-utils"

interface TrendingHashtagsProps {
  limit?: number
  showHeader?: boolean
  className?: string
}

export function TrendingHashtags({
  limit = 10,
  showHeader = true,
  className = "",
}: TrendingHashtagsProps) {
  const trendingHashtags = useQuery(api.hashtags.getTrending, { limit })

  if (trendingHashtags === undefined) {
    // Loading state — show skeleton
    return (
      <div className={`rounded-lg bg-card p-4 shadow-elevation-1 ${className}`}>
        {showHeader && (
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Trending Hashtags</h2>
          </div>
        )}
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-6 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (trendingHashtags.length === 0) {
    return null
  }

  return (
    <div className={`rounded-lg bg-card p-4 shadow-elevation-1 ${className}`}>
      {showHeader && (
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">
            Trending Hashtags
          </h2>
        </div>
      )}

      <div className="space-y-3">
        {trendingHashtags.map((hashtag, index) => (
          <Link
            key={hashtag._id}
            href={`/hashtag/${hashtag.tag}`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors group"
          >
            {/* Rank */}
            <div className="flex items-center justify-center w-6 h-6 text-xs font-bold text-muted-foreground">
              {index + 1}
            </div>

            {/* Icon */}
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
              <Hash className="w-4 h-4" />
            </div>

            {/* Hashtag Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary dark:group-hover:text-primary transition-colors">
                {getHashtagDisplay(hashtag.tag)}
              </p>
              <p className="text-xs text-muted-foreground">
                {hashtag.postCount.toLocaleString()} {hashtag.postCount === 1 ? "post" : "posts"}
              </p>
            </div>

            {/* Trending Indicator */}
            {index < 3 && (
              <TrendingUp className="w-4 h-4 text-accent-emerald" />
            )}
          </Link>
        ))}
      </div>

      {/* View All Link */}
      {trendingHashtags.length >= limit && (
        <div className="mt-4 pt-4 border-t border-border">
          <Link
            href="/discover?tab=trending"
            className="block text-center text-sm text-primary hover:text-primary text-primary dark:hover:text-blue-300 font-medium"
          >
            View all trending topics →
          </Link>
        </div>
      )}
    </div>
  )
}
