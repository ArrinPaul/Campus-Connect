/**
 * Production Product Analytics Abstraction for Campus Connect.
 * Integrates PostHog with secure data scrubbing and graceful offline fallbacks.
 */
import { scrubSensitiveData } from "@/lib/logger"

export type AnalyticsEventName =
  | "signup_completed"
  | "login_completed"
  | "profile_completed"
  | "post_created"
  | "post_reacted"
  | "post_commented"
  | "user_followed"
  | "message_sent"
  | "call_started"
  | "call_completed"
  | "research_uploaded"
  | "research_voted"
  | "research_reviewed"
  | "marketplace_listing_created"
  | "marketplace_listing_viewed"
  | "marketplace_listing_updated"
  | "leaderboard_viewed"
  | "skill_endorsed"
  | "badge_earned"
  | "notification_opened"
  | "push_enabled"
  | "subscription_checkout_started"
  | "subscription_started"
  | "subscription_cancelled"
  | "matching_partner_discovered"

export interface AnalyticsProperties {
  [key: string]: unknown
}

class AnalyticsManager {
  private isBrowser = typeof window !== "undefined"

  /**
   * Track a typed product event.
   */
  track(event: AnalyticsEventName, properties?: AnalyticsProperties): void {
    if (!this.isBrowser) return

    try {
      const cleanProperties = scrubSensitiveData(properties ?? {}) as Record<string, unknown>
      const posthog = (window as any).posthog
      if (posthog && typeof posthog.capture === "function") {
        posthog.capture(event, cleanProperties)
      }
    } catch {
      // Analytics failures must never crash user workflows
    }
  }

  /**
   * Associate events with a specific user.
   */
  identify(userId: string, traits?: AnalyticsProperties): void {
    if (!this.isBrowser || !userId) return

    try {
      const cleanTraits = scrubSensitiveData(traits ?? {}) as Record<string, unknown>
      const posthog = (window as any).posthog
      if (posthog && typeof posthog.identify === "function") {
        posthog.identify(userId, cleanTraits)
      }
    } catch {
      // Graceful fallback
    }
  }

  /**
   * Reset session on user logout.
   */
  reset(): void {
    if (!this.isBrowser) return

    try {
      const posthog = (window as any).posthog
      if (posthog && typeof posthog.reset === "function") {
        posthog.reset()
      }
    } catch {
      // Graceful fallback
    }
  }
}

export const analytics = new AnalyticsManager()
