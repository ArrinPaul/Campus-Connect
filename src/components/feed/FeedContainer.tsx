"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { PostCard } from "@/components/posts/PostCard"
import { InfiniteScrollTrigger } from "./InfiniteScrollTrigger"

export function FeedContainer() {
  const { isLoaded, isSignedIn } = useUser()
  const [allPosts, setAllPosts] = useState<any[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const hasInitializedRef = useRef(false)

  // Initial query - only run when authenticated
  const feedData = useQuery(
    api.posts.getFeedPosts,
    isLoaded && isSignedIn ? { limit: 20 } : "skip"
  )

  // Query for loading more posts
  const moreFeedData = useQuery(
    api.posts.getFeedPosts,
    isLoaded && isSignedIn && cursor && isLoadingMore ? { limit: 20, cursor } : "skip"
  )

  // Update allPosts when initial data loads or updates (real-time)
  useEffect(() => {
    if (!feedData) return
    
    if (!hasInitializedRef.current) {
      setAllPosts(feedData.posts)
      setCursor(feedData.nextCursor)
      hasInitializedRef.current = true
    } else if (!isLoadingMore) {
      // Handle real-time updates for the initial batch
      // Only update if we're not currently loading more posts
      setAllPosts((prev) => {
        // Merge new posts with existing ones, avoiding duplicates
        const existingIds = new Set(prev.map((p: any) => p._id))
        const newPosts = feedData.posts.filter((p: any) => !existingIds.has(p._id))
        return [...newPosts, ...prev]
      })
      setCursor(feedData.nextCursor)
    }
  }, [feedData, isLoadingMore])

  // Update allPosts when more data loads
  useEffect(() => {
    if (moreFeedData && isLoadingMore) {
      setAllPosts((prev) => [...prev, ...moreFeedData.posts])
      setCursor(moreFeedData.nextCursor)
      setIsLoadingMore(false)
    }
  }, [moreFeedData, isLoadingMore])

  // Handle loading more posts
  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && cursor) {
      setIsLoadingMore(true)
    }
  }, [isLoadingMore, cursor])

  // Show loading state while auth is being checked
  if (!isLoaded) {
    return (
      <div className="space-y-3 sm:space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg bg-white dark:bg-gray-800 p-4 shadow dark:shadow-gray-900/50 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 sm:h-10 sm:w-10" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700 sm:h-4 sm:w-32" />
                <div className="h-2 w-16 rounded bg-gray-200 dark:bg-gray-700 sm:h-3 sm:w-24" />
              </div>
            </div>
            <div className="mt-3 space-y-2 sm:mt-4">
              <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700 sm:h-4" />
              <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-700 sm:h-4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Handle not authenticated
  if (!isSignedIn) {
    return (
      <div className="rounded-lg bg-white dark:bg-gray-800 p-8 text-center shadow dark:shadow-gray-900/50">
        <p className="text-gray-600 dark:text-gray-400">Please sign in to view the feed.</p>
      </div>
    )
  }

  // Initial loading state
  if (feedData === undefined) {
    return (
      <div className="space-y-3 sm:space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg bg-white dark:bg-gray-800 p-4 shadow dark:shadow-gray-900/50 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 sm:h-10 sm:w-10" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700 sm:h-4 sm:w-32" />
                <div className="h-2 w-16 rounded bg-gray-200 dark:bg-gray-700 sm:h-3 sm:w-24" />
              </div>
            </div>
            <div className="mt-3 space-y-2 sm:mt-4">
              <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700 sm:h-4" />
              <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-700 sm:h-4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Empty state
  if (allPosts.length === 0 && hasInitializedRef.current) {
    return (
      <div className="rounded-lg bg-white dark:bg-gray-800 p-8 text-center shadow dark:shadow-gray-900/50 sm:p-12">
        <svg
          className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500 sm:h-12 sm:w-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
          />
        </svg>
        <h3 className="mt-3 text-base font-medium text-gray-900 dark:text-gray-100 sm:mt-4 sm:text-lg">No posts yet</h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 sm:mt-2 sm:text-sm">
          Be the first to share something or follow users to see their posts here.
        </p>
      </div>
    )
  }

  // Display posts with infinite scroll
  return (
    <div className="space-y-3 sm:space-y-4">
      {allPosts.map((postWithAuthor) => {
        // Skip posts without author data
        if (!postWithAuthor.author) {
          return null
        }

        return (
          <PostCard
            key={postWithAuthor._id}
            post={postWithAuthor}
            author={postWithAuthor.author}
          />
        )
      })}
      <InfiniteScrollTrigger
        onTrigger={handleLoadMore}
        hasMore={!!cursor}
        isLoading={isLoadingMore}
      />
    </div>
  )
}
