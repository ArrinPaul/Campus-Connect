"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, Suspense } from "react"
import { usePostHogIdentify } from "@/components/providers/posthog-provider"
import posthog from "posthog-js"

function PostHogPageViewInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Identify user in PostHog from Clerk
  usePostHogIdentify()

  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname
      if (searchParams?.toString()) {
        url = url + `?${searchParams.toString()}`
      }
      posthog.capture("$pageview", { $current_url: url })
    }
  }, [pathname, searchParams])

  return null
}

/**
 * Tracks page views in PostHog for SPA navigation.
 * Wrapped in Suspense because useSearchParams() requires it.
 */
export function PostHogPageView() {
  return (
    <Suspense fallback={null}>
      <PostHogPageViewInner />
    </Suspense>
  )
}
