"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import { useQuery, useConvexAuth } from "convex/react"
import { api } from "@/convex/_generated/api"
import { PostCard } from "@/components/posts/PostCard"
import { InfiniteScrollTrigger } from "./InfiniteScrollTrigger"
import { VirtualizedFeed } from "./VirtualizedFeed"
import { Repeat2 } from "lucide-react"
import { SuggestedUsers } from "@/components/discover/SuggestedUsers"
import { TrendingHashtags } from "@/components/trending/TrendingHashtags"
import type { FunctionReturnType } from "convex/server"

type FeedType = "following" | "for-you" | "trending"

type ConvexFeedItem = NonNullable<FunctionReturnType<typeof api.feed_ranking.getRankedFeed>>["items"][number]

interface FeedContainerProps {
  feedType?: FeedType
}

export function FeedContainer({ feedType = "following" }: FeedContainerProps) {
  const { isLoaded, isSignedIn } = useUser()
  const convexAuth = useConvexAuth()
  const isAuthenticated = convexAuth?.isAuthenticated ?? false
  const [allItems, setAllItems] = useState<ConvexFeedItem[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const hasInitializedRef = useRef(false)
  const prevFeedTypeRef = useRef(feedType)

  // Determine which query to use based on feedType
  const queryArgs = isAuthenticated ? { limit: 20 } : "skip" as const
  const moreQueryArgs =
    isAuthenticated && cursor && isLoadingMore
      ? { limit: 20, cursor }
      : ("skip" as const)

  // Queries for each feed type (Convex requires static query references)
  const followingDataRaw = useQuery(
    api.posts.getFeedPosts,
    feedType === "following" ? queryArgs : "skip"
  )
  const forYouData = useQuery(
    api.feed_ranking.getRankedFeed,
    feedType === "for-you" ? queryArgs : "skip"
  )
  const trendingData = useQuery(
    api.feed_ranking.getTrendingFeed,
    feedType === "trending" ? queryArgs : "skip"
  )

  // More data queries
  const moreFollowingDataRaw = useQuery(
    api.posts.getFeedPosts,
    feedType === "following" ? moreQueryArgs : "skip"
  )
  const moreForYouData = useQuery(
    api.feed_ranking.getRankedFeed,
    feedType === "for-you" ? moreQueryArgs : "skip"
  )
  const moreTrendingData = useQuery(
    api.feed_ranking.getTrendingFeed,
    feedType === "trending" ? moreQueryArgs : "skip"
  )

  // Normalize getFeedPosts response ({posts}) → shared {items, nextCursor, hasMore} shape
  const followingData = followingDataRaw
    ? {
        items: (followingDataRaw.posts.filter(Boolean) as NonNullable<typeof followingDataRaw.posts[number]>[]).map((post) => ({
          type: "post" as const,
          _id: post._id,
          createdAt: post.createdAt,
          authorId: String(post.authorId),
          post,
        })),
        nextCursor: followingDataRaw.nextCursor,
        hasMore: followingDataRaw.hasMore,
      }
    : undefined

  const moreFollowingData = moreFollowingDataRaw
    ? {
        items: (moreFollowingDataRaw.posts.filter(Boolean) as NonNullable<typeof moreFollowingDataRaw.posts[number]>[]).map((post) => ({
          type: "post" as const,
          _id: post._id,
          createdAt: post.createdAt,
          authorId: String(post.authorId),
          post,
        })),
        nextCursor: moreFollowingDataRaw.nextCursor,
        hasMore: moreFollowingDataRaw.hasMore,
      }
    : undefined

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
      setAllItems(feedData.items as ConvexFeedItem[])
      setCursor(feedData.nextCursor)
      hasInitializedRef.current = true
    } else if (!isLoadingMore) {
      // Handle real-time updates for the initial batch
      setAllItems((prev) => {
        const existingIds = new Set(prev.map((item) => item._id))
        const newItems = (feedData.items as ConvexFeedItem[]).filter((item) => !existingIds.has(item._id))
        return [...newItems, ...prev]
      })
      setCursor(feedData.nextCursor)
    }
  }, [feedData, isLoadingMore])

  // Update allItems when more data loads
  useEffect(() => {
    if (moreFeedData && isLoadingMore) {
      setAllItems((prev) => [...prev, ...(moreFeedData.items as ConvexFeedItem[])])
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
        <div key={i} className="animate-pulse rounded-lg bg-card p-4 shadow-elevation-1 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 rounded-full bg-muted sm:h-10 sm:w-10" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 rounded bg-muted sm:h-4 sm:w-32" />
              <div className="h-2 w-16 rounded bg-muted sm:h-3 sm:w-24" />
            </div>
          </div>
          <div className="mt-3 space-y-2 sm:mt-4">
            <div className="h-3 w-full rounded bg-muted sm:h-4" />
            <div className="h-3 w-3/4 rounded bg-muted sm:h-4" />
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
      <div className="rounded-lg bg-card p-8 text-center shadow-elevation-1">
        <p className="text-muted-foreground">Please sign in to view the feed.</p>
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
      <div className="space-y-4">
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 text-center shadow-elevation-1 sm:p-8">
          <div className="mx-auto h-12 w-12 rounded-2xl brand-gradient flex items-center justify-center shadow-glow-sm">
            <Repeat2 className="h-5 w-5 text-white" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground sm:text-xl font-display">{title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/discover"
              className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/15 transition-colors"
            >
              Explore communities
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center rounded-full border border-border/60 px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted/60 transition-colors"
            >
              Search topics
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-card shadow-elevation-1 overflow-hidden">
            <div className="h-[3px] w-full gradient-warm" />
            <SuggestedUsers limit={4} showSeeAll />
          </div>
          <div className="rounded-2xl border border-border/60 bg-card shadow-elevation-1 overflow-hidden">
            <div className="h-[3px] w-full brand-gradient" />
            <TrendingHashtags limit={8} />
          </div>
        </div>
      </div>
    )
  }

  // Display posts and reposts with virtualized infinite scroll
  return (
    <VirtualizedFeed
      items={allItems}
      hasMore={!!cursor}
      isLoadingMore={isLoadingMore}
      onLoadMore={handleLoadMore}
    />
  )
}
