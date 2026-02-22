"use client"

import { useEffect } from "react"
import { createLogger } from "@/lib/logger"

const log = createLogger("dashboard/error")

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    log.error("Dashboard error", error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <svg
          className="mx-auto h-16 w-16 text-destructive"
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
        <h2 className="mt-6 text-2xl font-bold font-display text-foreground">
          Something went wrong
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred while loading this page"}
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <button
            onClick={reset}
            className="rounded-xl bg-destructive px-6 py-2 text-sm font-medium text-white hover:bg-destructive/90 transition-colors"
          >
            Try Again
          </button>
          <a
            href="/feed"
            className="rounded-xl border border-destructive/40 px-6 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            Go to Feed
          </a>
        </div>
      </div>
    </div>
  )
}
