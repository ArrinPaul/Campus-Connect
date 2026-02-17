"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { PostCard } from "@/components/posts/PostCard"

export function FeedContainer() {
  const feedData = useQuery(api.posts.getFeedPosts, { limit: 20 })

  // Loading state
  if (feedData === undefined) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg bg-white p-6 shadow">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-gray-200" />
                <div className="h-3 w-24 rounded bg-gray-200" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-4 w-full rounded bg-gray-200" />
              <div className="h-4 w-3/4 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Empty state
  if (!feedData.posts || feedData.posts.length === 0) {
    return (
      <div className="rounded-lg bg-white p-12 text-center shadow">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
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
        <h3 className="mt-4 text-lg font-medium text-gray-900">No posts yet</h3>
        <p className="mt-2 text-sm text-gray-500">
          Be the first to share something or follow users to see their posts here.
        </p>
      </div>
    )
  }

  // Display posts
  return (
    <div className="space-y-4">
      {feedData.posts.map((postWithAuthor) => {
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
    </div>
  )
}
