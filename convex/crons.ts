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

export default crons
