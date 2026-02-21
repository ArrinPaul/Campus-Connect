import { cronJobs } from "convex/server"
import { internal } from "./_generated/api"

const crons = cronJobs()

/**
 * Run every hour to delete stories whose 24-hour TTL has expired,
 * along with all associated storyViews records.
 */
crons.interval(
  "delete expired stories",
  { hours: 1 },
  internal.stories.deleteExpiredStoriesInternal
)

/**
 * Re-compute friend suggestions for all active users every 6 hours.
 * Phase 4.1 — Friend Suggestion Engine
 */
crons.interval(
  "compute friend suggestions",
  { hours: 6 },
  internal.suggestions.computeAllSuggestions
)

/**
 * Send event reminders every hour.
 * Notifies attendees of events starting in ~24h or ~1h.
 * Phase 5.3 — Events & Scheduling
 */
crons.interval(
  "send event reminders",
  { hours: 1 },
  internal.events.sendEventReminders
)

/**
 * Clean up stale typing indicators every 5 minutes.
 * Deletes entries older than 30 seconds to prevent database bloat.
 * Phase 2.1 — Real-Time Communication / Typing Indicators
 */
crons.interval(
  "cleanup typing indicators",
  { minutes: 5 },
  internal.presence.cleanupTypingIndicators
)

/**
 * Re-compute hashtag trending scores every hour.
 * Uses time-decay formula: score = postCount * recencyMultiplier + recentPosts * 2
 * Phase 3.4 — Trending Hashtags
 */
crons.interval(
  "update trending scores",
  { hours: 1 },
  internal.hashtags.updateTrendingScores
)

/**
 * Expire ringing calls that have been ringing > 60 seconds.
 * Prevents orphaned calls when the caller's client crashes.
 * Phase 2.4 — Voice & Video Calls
 */
crons.interval(
  "expire stale ringing calls",
  { minutes: 5 },
  internal.calls.expireStaleRingingCalls
)

export default crons
