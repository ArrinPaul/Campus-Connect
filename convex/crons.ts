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

export default crons
