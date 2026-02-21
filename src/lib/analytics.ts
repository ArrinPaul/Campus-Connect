import posthog from "posthog-js"

/**
 * Centralized analytics event tracking.
 * All product analytics events should be fired through this module
 * to maintain a consistent event taxonomy.
 */

// ─── Post Events ─────────────────────────────────────
export function trackPostCreated(properties?: {
  hasMedia?: boolean
  hasHashtags?: boolean
  hasMentions?: boolean
  hasPoll?: boolean
  contentLength?: number
}) {
  posthog.capture("post_created", properties)
}

export function trackPostLiked(postId: string) {
  posthog.capture("post_liked", { postId })
}

export function trackPostShared(postId: string, method: "repost" | "copy_link" | "external") {
  posthog.capture("post_shared", { postId, method })
}

// ─── Comment Events ──────────────────────────────────
export function trackCommentCreated(postId: string) {
  posthog.capture("comment_created", { postId })
}

// ─── Profile Events ──────────────────────────────────
export function trackProfileViewed(profileId: string) {
  posthog.capture("profile_viewed", { profileId })
}

export function trackFollowToggled(targetUserId: string, action: "follow" | "unfollow") {
  posthog.capture("follow_toggled", { targetUserId, action })
}

// ─── Messaging Events ───────────────────────────────
export function trackMessageSent(conversationId: string) {
  posthog.capture("message_sent", { conversationId })
}

export function trackCallStarted(type: "audio" | "video") {
  posthog.capture("call_started", { type })
}

// ─── Search Events ──────────────────────────────────
export function trackSearchPerformed(query: string, resultCount: number) {
  posthog.capture("search_performed", {
    query,
    resultCount,
    queryLength: query.length,
  })
}

// ─── Marketplace Events ─────────────────────────────
export function trackListingCreated(category: string) {
  posthog.capture("listing_created", { category })
}

export function trackListingViewed(listingId: string) {
  posthog.capture("listing_viewed", { listingId })
}

// ─── Community Events ───────────────────────────────
export function trackCommunityJoined(communityId: string) {
  posthog.capture("community_joined", { communityId })
}

export function trackCommunityCreated() {
  posthog.capture("community_created")
}

// ─── Resource Events ────────────────────────────────
export function trackResourceDownloaded(resourceId: string, type: string) {
  posthog.capture("resource_downloaded", { resourceId, type })
}

export function trackResourceUploaded(type: string) {
  posthog.capture("resource_uploaded", { type })
}

// ─── Feature Usage Events ───────────────────────────
export function trackFeatureUsed(featureName: string, properties?: Record<string, unknown>) {
  posthog.capture("feature_used", { featureName, ...properties })
}

// ─── Onboarding Events ─────────────────────────────
export function trackOnboardingStep(step: string, completed: boolean) {
  posthog.capture("onboarding_step", { step, completed })
}

export function trackOnboardingCompleted() {
  posthog.capture("onboarding_completed")
}
