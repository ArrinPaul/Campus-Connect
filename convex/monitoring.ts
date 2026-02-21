import { query } from "./_generated/server"
import { Id } from "./_generated/dataModel"

// ──────────────────────────────────────────────
// Admin auth helper — requires authenticated user with isAdmin flag
// ──────────────────────────────────────────────
async function requireAdmin(ctx: any): Promise<Id<"users">> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error("Unauthorized: authentication required")
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
    .unique()
  if (!user) throw new Error("Unauthorized: user not found")
  if (!user.isAdmin) throw new Error("Forbidden: admin access required")
  return user._id
}

/**
 * Get system statistics for admin monitoring dashboard
 * Returns metrics for the last hour and total counts
 * Requires authentication (admin-gated)
 */
export const getSystemStats = query({
  handler: async (ctx) => {
    await requireAdmin(ctx)

    const oneHourAgo = Date.now() - 60 * 60 * 1000
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000

    // Count recent activity (last hour)
    const recentPosts = await ctx.db
      .query("posts")
      .order("desc")
      .filter((q) => q.gt(q.field("createdAt"), oneHourAgo))
      .collect()

    const recentUsers = await ctx.db
      .query("users")
      .order("desc")
      .filter((q) => q.gt(q.field("createdAt"), oneHourAgo))
      .collect()

    const recentComments = await ctx.db
      .query("comments")
      .order("desc")
      .filter((q) => q.gt(q.field("createdAt"), oneHourAgo))
      .collect()

    const recentMessages = await ctx.db
      .query("messages")
      .order("desc")
      .filter((q) => q.gt(q.field("createdAt"), oneHourAgo))
      .collect()

    // Count activity in last 24 hours
    const dailyPosts = await ctx.db
      .query("posts")
      .order("desc")
      .filter((q) => q.gt(q.field("createdAt"), oneDayAgo))
      .collect()

    const dailyUsers = await ctx.db
      .query("users")
      .order("desc")
      .filter((q) => q.gt(q.field("createdAt"), oneDayAgo))
      .collect()

    // Total counts (use take to limit for performance)
    const allUsers = await ctx.db.query("users").collect()
    const allPosts = await ctx.db.query("posts").collect()
    const allComments = await ctx.db.query("comments").collect()
    const allMessages = await ctx.db.query("messages").collect()

    // Active communities
    const allCommunities = await ctx.db.query("communities").collect()

    // Calculate engagement metrics
    const totalReactions = await ctx.db.query("reactions").collect()
    const totalBookmarks = await ctx.db.query("bookmarks").collect()

    return {
      timestamp: Date.now(),
      users: {
        total: allUsers.length,
        lastHour: recentUsers.length,
        last24Hours: dailyUsers.length,
      },
      posts: {
        total: allPosts.length,
        lastHour: recentPosts.length,
        last24Hours: dailyPosts.length,
      },
      comments: {
        total: allComments.length,
        lastHour: recentComments.length,
      },
      messages: {
        total: allMessages.length,
        lastHour: recentMessages.length,
      },
      engagement: {
        totalReactions: totalReactions.length,
        totalBookmarks: totalBookmarks.length,
        avgReactionsPerPost: allPosts.length > 0 
          ? (totalReactions.length / allPosts.length).toFixed(2) 
          : "0",
      },
      communities: {
        total: allCommunities.length,
      },
    }
  },
})

/**
 * Get top contributors (most active users)
 */
export const getTopContributors = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)

    // Get all posts with author info
    const posts = await ctx.db.query("posts").collect()
    
    // Count posts per author
    const postCounts = new Map<string, number>()
    for (const post of posts) {
      const count = postCounts.get(post.authorId) || 0
      postCounts.set(post.authorId, count + 1)
    }

    // Get top 10 authors
    const topAuthorIds = Array.from(postCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([authorId]) => authorId)

    // Fetch user info for top authors
    const topUsers = await Promise.all(
      topAuthorIds.map(async (authorId) => {
        const user = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("_id"), authorId))
          .first()
        return user ? {
          name: user.name || "Unknown",
          username: user.username || "unknown",
          postCount: postCounts.get(authorId) || 0,
        } : null
      })
    )

    return topUsers.filter((u): u is NonNullable<typeof u> => u !== null)
  },
})

/**
 * Get recent errors or issues (placeholder for future integration)
 */
export const getRecentIssues = query({
  handler: async (ctx) => {
    await requireAdmin(ctx)

    // This would integrate with your error tracking system (Sentry, etc.)
    // For now, return empty array
    // In production, you might track failed operations in a separate table
    return []
  },
})

/**
 * Get performance metrics
 */
export const getPerformanceMetrics = query({
  handler: async (ctx) => {
    await requireAdmin(ctx)

    const oneHourAgo = Date.now() - 60 * 60 * 1000

    // Count queries/mutations (approximate based on posts/comments created)
    const recentActivity = await ctx.db
      .query("posts")
      .order("desc")
      .filter((q) => q.gt(q.field("createdAt"), oneHourAgo))
      .collect()

    const recentComments = await ctx.db
      .query("comments")
      .order("desc")
      .filter((q) => q.gt(q.field("createdAt"), oneHourAgo))
      .collect()

    // Estimate queries per second
    const totalOperations = recentActivity.length + recentComments.length
    const qps = (totalOperations / 3600).toFixed(2) // operations per second in last hour

    return {
      estimatedQPS: qps,
      recentOperations: totalOperations,
      status: totalOperations > 1000 ? "high" : totalOperations > 100 ? "normal" : "low",
    }
  },
})
