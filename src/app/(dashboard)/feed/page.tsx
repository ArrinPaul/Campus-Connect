"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { PostComposer } from "@/components/posts/PostComposer"
import { FeedContainer } from "@/components/feed/FeedContainer"
import { ErrorBoundary } from "@/components/error-boundary"
import { TrendingHashtags } from "@/components/trending/TrendingHashtags"
import { StoryRow } from "@/components/stories/StoryRow"
import { SuggestedUsers } from "@/components/discover/SuggestedUsers"

export type FeedType = "for-you" | "following" | "trending"

const FEED_STORAGE_KEY = "campus-connect-feed-type"

export default function FeedPage() {
  const { isLoaded, isSignedIn } = useUser()
  const [feedType, setFeedType] = useState<FeedType>("for-you")

  // Persist feed preference in localStorage
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

  // Show loading state while auth is being checked
  if (!isLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    )
  }

  // This shouldn't happen due to middleware, but just in case
  if (!isSignedIn) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Not Authenticated</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Please sign in to view the feed.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Feed - Left Column */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-6">
          {/* Story Ring Row */}
          <ErrorBoundary>
            <div className="rounded-lg bg-white dark:bg-gray-800 shadow dark:shadow-gray-900/50 px-2 py-1">
              <StoryRow />
            </div>
          </ErrorBoundary>

          {/* Post Composer */}
          <ErrorBoundary>
            <div className="rounded-lg bg-white dark:bg-gray-800 p-4 shadow dark:shadow-gray-900/50 sm:p-6">
              <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-gray-100 sm:mb-4 sm:text-lg">Create a Post</h2>
              <PostComposer />
            </div>
          </ErrorBoundary>

          {/* Feed Type Tabs */}
          <div className="flex rounded-lg bg-white dark:bg-gray-800 shadow dark:shadow-gray-900/50 p-1">
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
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  feedType === key
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Feed Container with real-time updates */}
          <ErrorBoundary>
            <FeedContainer feedType={feedType} />
          </ErrorBoundary>
        </div>

        {/* Trending Sidebar - Right Column (Hidden on mobile) */}
        <aside className="hidden lg:block lg:col-span-4">
          <div className="sticky top-20 space-y-4">
            <ErrorBoundary>
              <TrendingHashtags limit={10} />
            </ErrorBoundary>
            <ErrorBoundary>
              <SuggestedUsers limit={3} showSeeAll />
            </ErrorBoundary>
          </div>
        </aside>
      </div>
    </div>
  )
}
