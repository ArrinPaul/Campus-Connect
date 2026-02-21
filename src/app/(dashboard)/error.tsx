"use client"

import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Dashboard error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
        <svg
          className="mx-auto h-16 w-16 text-destructive dark:text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h2 className="mt-6 text-2xl font-bold text-red-900 dark:text-red-100">
          Something went wrong
        </h2>
        <p className="mt-3 text-sm text-red-700 dark:text-red-300">
          {error.message || "An unexpected error occurred while loading this page"}
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <button
            onClick={reset}
            className="rounded-md bg-destructive px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-red-700 dark:bg-red-700 dark:hover:bg-destructive"
          >
            Try Again
          </button>
          <a
            href="/feed"
            className="rounded-md border border-red-600 px-6 py-2 text-sm font-medium text-destructive hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            Go to Feed
          </a>
        </div>
      </div>
    </div>
  )
}
