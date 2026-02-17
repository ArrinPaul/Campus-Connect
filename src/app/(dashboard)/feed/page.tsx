"use client"

import { PostComposer } from "@/components/posts/PostComposer"
import { FeedContainer } from "@/components/feed/FeedContainer"
import { ErrorBoundary } from "@/components/error-boundary"

export default function FeedPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Post Composer */}
      <ErrorBoundary>
        <div className="rounded-lg bg-white dark:bg-gray-800 p-4 shadow dark:shadow-gray-900/50 sm:p-6">
          <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-gray-100 sm:mb-4 sm:text-lg">Create a Post</h2>
          <PostComposer />
        </div>
      </ErrorBoundary>

      {/* Feed Container with real-time updates */}
      <ErrorBoundary>
        <FeedContainer />
      </ErrorBoundary>
    </div>
  )
}
