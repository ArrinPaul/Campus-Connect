"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { PostCard } from "@/components/posts/PostCard"
import { InfiniteScrollTrigger } from "./InfiniteScrollTrigger"
import { Repeat2 } from "lucide-react"
import type { FeedType } from "@/app/(dashboard)/feed/page"

interface FeedContainerProps {
  feedType?: FeedType
}

export function FeedContainer({ feedType = "following" }: FeedContainerProps) {
  const { isLoaded, isSignedIn } = useUser()
  const [allItems, setAllItems] = useState<any[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const hasInitializedRef = useRef(false)
  const prevFeedTypeRef = useRef(feedType)

  // Determine which query to use based on feedType
  const queryArgs = isLoaded && isSignedIn ? { limit: 20 } : "skip" as const
  const moreQueryArgs =
    isLoaded && isSignedIn && cursor && isLoadingMore
      ? { limit: 20, cursor }
      : ("skip" as const)

  // Queries for each feed type (Convex requires static query references)
  const followingData = useQuery(
    api.posts.getUnifiedFeed,
    feedType === "following" ? queryArgs : "skip"
  )
  const forYouData = useQuery(
    api.feedRanking.getRankedFeed,
    feedType === "for-you" ? queryArgs : "skip"
  )
  const trendingData = useQuery(
    api.feedRanking.getTrendingFeed,
    feedType === "trending" ? queryArgs : "skip"
  )

  // More data queries
  const moreFollowingData = useQuery(
    api.posts.getUnifiedFeed,
    feedType === "following" ? moreQueryArgs : "skip"
  )
  const moreForYouData = useQuery(
    api.feedRanking.getRankedFeed,
    feedType === "for-you" ? moreQueryArgs : "skip"
  )
  const moreTrendingData = useQuery(
    api.feedRanking.getTrendingFeed,
    feedType === "trending" ? moreQueryArgs : "skip"
  )

  // Select active feed data based on feedType
  const feedData =
    feedType === "for-you"
      ? forYouData
      : feedType === "trending"
        ? trendingData
        : followingData

  const moreFeedData =
    feedType === "for-you"
      ? moreForYouData
      : feedType === "trending"
        ? moreTrendingData
        : moreFollowingData

  // Reset when feed type changes
  useEffect(() => {
    if (prevFeedTypeRef.current !== feedType) {
      setAllItems([])
      setCursor(null)
      setIsLoadingMore(false)
      hasInitializedRef.current = false
      prevFeedTypeRef.current = feedType
    }
  }, [feedType])

  // Update allItems when initial data loads or updates (real-time)
  useEffect(() => {
    if (!feedData) return
    
    if (!hasInitializedRef.current) {
      setAllItems(feedData.items)
      setCursor(feedData.nextCursor)
      hasInitializedRef.current = true
    } else if (!isLoadingMore) {
      // Handle real-time updates for the initial batch
      setAllItems((prev) => {
        const existingIds = new Set(prev.map((item: any) => item._id))
        const newItems = feedData.items.filter((item: any) => !existingIds.has(item._id))
        return [...newItems, ...prev]
      })
      setCursor(feedData.nextCursor)
    }
  }, [feedData, isLoadingMore])

  // Update allItems when more data loads
  useEffect(() => {
    if (moreFeedData && isLoadingMore) {
      setAllItems((prev) => [...prev, ...moreFeedData.items])
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

  // Loading skeleton
  const LoadingSkeleton = () => (
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

  // Show loading state while auth is being checked
  if (!isLoaded) {
    return <LoadingSkeleton />
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
    return <LoadingSkeleton />
  }

  // Empty state
  if (allItems.length === 0 && hasInitializedRef.current) {
    const emptyMessages: Record<FeedType, { title: string; description: string }> = {
      "for-you": {
        title: "No recommendations yet",
        description: "Add skills to your profile and interact with posts to get personalized recommendations.",
      },
      following: {
        title: "No posts yet",
        description: "Be the first to share something or follow users to see their posts here.",
      },
      trending: {
        title: "Nothing trending",
        description: "No posts have gained traction recently. Check back later!",
      },
    }

    const { title, description } = emptyMessages[feedType]

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
        <h3 className="mt-3 text-base font-medium text-gray-900 dark:text-gray-100 sm:mt-4 sm:text-lg">{title}</h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 sm:mt-2 sm:text-sm">
          {description}
        </p>
      </div>
    )
  }

  // Display posts and reposts with infinite scroll
  return (
    <div className="space-y-3 sm:space-y-4">
      {allItems.map((item) => {
        // Handle original posts
        if (item.type === "post") {
          if (!item.post.author) return null

          return (
            <PostCard
              key={`post-${item._id}`}
              post={item.post}
              author={item.post.author}
            />
          )
        }

        // Handle reposts
        if (item.type === "repost") {
          if (!item.post.author || !item.reposter) return null

          return (
            <div key={`repost-${item._id}`} className="space-y-1">
              {/* Repost header */}
              <div className="flex items-center gap-2 px-4 pt-3 text-xs text-gray-500 dark:text-gray-400">
                <Repeat2 className="h-3 w-3" />
                <span>
                  {item.reposter.name || item.reposter.username} reposted
                </span>
              </div>
              
              {/* Quote content if present */}
              {item.quoteContent && (
                <div className="px-4 pb-2">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {item.quoteContent}
                  </p>
                </div>
              )}

              {/* Original post */}
              <PostCard
                post={item.post}
                author={item.post.author}
              />
            </div>
          )
        }

        return null
      })}
      <InfiniteScrollTrigger
        onTrigger={handleLoadMore}
        hasMore={!!cursor}
        isLoading={isLoadingMore}
      />
    </div>
  )
}
