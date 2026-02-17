"use client"

import { useUser } from "@clerk/nextjs"
import { PostComposer } from "@/components/posts/PostComposer"
import { FeedContainer } from "@/components/feed/FeedContainer"
import { ErrorBoundary } from "@/components/error-boundary"

export default function FeedPage() {
  const { isLoaded, isSignedIn } = useUser()

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
