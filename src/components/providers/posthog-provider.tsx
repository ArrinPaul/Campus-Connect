"use client"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider } from "posthog-js/react"
import { useEffect } from "react"
import { useAuth, useUser } from "@clerk/nextjs"

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      process.env.NEXT_PUBLIC_POSTHOG_KEY
    ) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host:
          process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
        person_profiles: "identified_only",
        capture_pageview: false, // We capture manually for SPA navigation
        capture_pageleave: true,
        autocapture: {
          dom_event_allowlist: ["click", "submit"],
          css_selector_allowlist: [
            "[data-ph-capture]",
            "button",
            "a",
            "input[type=submit]",
          ],
        },
        persistence: "localStorage+cookie",
        loaded: (posthog) => {
          if (process.env.NODE_ENV === "development") {
            posthog.debug()
          }
        },
      })
    }
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}

/**
 * Hook to identify users in PostHog when they sign in via Clerk.
 * Use this in the dashboard layout or a top-level authenticated component.
 */
export function usePostHogIdentify() {
  const { userId } = useAuth()
  const { user } = useUser()

  useEffect(() => {
    if (userId && user) {
      posthog.identify(userId, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
        username: user.username,
        imageUrl: user.imageUrl,
      })
    }
  }, [userId, user])

  useEffect(() => {
    return () => {
      // Reset PostHog when user signs out
      if (!userId) {
        posthog.reset()
      }
    }
  }, [userId])
}
