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

export default crons
