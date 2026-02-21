"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { PostComposer } from "@/components/posts/PostComposer"
import { FeedContainer } from "@/components/feed/FeedContainer"
import { ErrorBoundary } from "@/components/error-boundary"
import { TrendingHashtags } from "@/components/trending/TrendingHashtags"
import { StoryRow } from "@/components/stories/StoryRow"
import { SuggestedUsers } from "@/components/discover/SuggestedUsers"
import { RecommendedPosts, TrendingInSkill } from "@/components/feed/RecommendedPosts"
import { cn } from "@/lib/utils"

export type FeedType = "for-you" | "following" | "trending"

const FEED_STORAGE_KEY = "campus-connect-feed-type"

export default function FeedPage() {
  const { isLoaded, isSignedIn } = useUser()
  const [feedType, setFeedType] = useState<FeedType>("for-you")

  useEffect(() => {
    const saved = localStorage.getItem(FEED_STORAGE_KEY) as FeedType | null
    if (saved && ["for-you", "following", "trending"].includes(saved)) {
      setFeedType(saved)
    }
  }, [])

  const handleFeedTypeChange = (type: FeedType) => {
    setFeedType(type)
    localStorage.setItem(FEED_STORAGE_KEY, type)
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading feed…</p>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">Not Authenticated</h2>
          <p className="mt-2 text-muted-foreground">Please sign in to view the feed.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-8 space-y-5">
          {/* Story Row */}
          <ErrorBoundary>
            <div className="card-elevated px-3 py-2">
              <StoryRow />
            </div>
          </ErrorBoundary>

          {/* Post Composer */}
          <ErrorBoundary>
            <div className="card-elevated p-5">
              <h2 className="mb-3 text-sm font-semibold text-foreground">
                Create a Post
              </h2>
              <PostComposer />
            </div>
          </ErrorBoundary>

          {/* Feed Tabs */}
          <div className="card-elevated p-1 flex">
            {(
              [
                { key: "for-you", label: "For You" },
                { key: "following", label: "Following" },
                { key: "trending", label: "Trending" },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleFeedTypeChange(key)}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  feedType === key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Feed */}
          <ErrorBoundary>
            <FeedContainer feedType={feedType} />
          </ErrorBoundary>
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block lg:col-span-4">
          <div className="sticky top-20 space-y-5">
            <ErrorBoundary>
              <TrendingHashtags limit={10} />
            </ErrorBoundary>
            <ErrorBoundary>
              <SuggestedUsers limit={3} showSeeAll />
            </ErrorBoundary>
            <ErrorBoundary>
              <RecommendedPosts limit={3} />
            </ErrorBoundary>
            <ErrorBoundary>
              <TrendingInSkill limit={5} />
            </ErrorBoundary>
          </div>
        </aside>
      </div>
    </div>
  )
}
