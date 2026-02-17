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
    console.error("Application error:", error)
  }, [error])

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md rounded-lg border border-red-200 bg-white p-8 text-center shadow-lg">
            <svg
              className="mx-auto h-16 w-16 text-red-600"
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
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Something went wrong
            </h2>
            <p className="mt-3 text-sm text-gray-600">
              {error.message || "An unexpected error occurred"}
            </p>
            <div className="mt-6 flex gap-3 justify-center">
              <button
                onClick={reset}
                className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Try Again
              </button>
              <a
                href="/"
                className="rounded-md border border-blue-600 px-6 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
