import { v } from "convex/values"
import { mutation, query, internalMutation } from "./_generated/server"
import { Id } from "./_generated/dataModel"

/**
 * Utility: Extract hashtags from content
 * Returns normalized hashtags (lowercase, without #)
 */
export function extractHashtags(content: string): string[] {
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g
  const matches = content.matchAll(hashtagRegex)
  const hashtags = Array.from(matches, (match) => match[1].toLowerCase())
  // Remove duplicates
  return Array.from(new Set(hashtags))
}

/**
 * Utility: Normalize hashtag (lowercase, trim)
 */
export function normalizeHashtag(tag: string): string {
  return tag.toLowerCase().trim().replace(/^#/, "")
}

/**
 * Internal: Create or update hashtag and link to post
 * Called by createPost mutation
 */
export async function linkHashtagsToPost(
  ctx: any,
  postId: Id<"posts">,
  content: string
): Promise<void> {
  const hashtags = extractHashtags(content)
  const now = Date.now()

  for (const tag of hashtags) {
    // Find or create hashtag
    const existingHashtag = await ctx.db
      .query("hashtags")
      .withIndex("by_tag", (q: any) => q.eq("tag", tag))
      .unique()

    let hashtagId: Id<"hashtags">

    if (existingHashtag) {
      // Update existing hashtag
      await ctx.db.patch(existingHashtag._id, {
        postCount: existingHashtag.postCount + 1,
        lastUsedAt: now,
      })
      hashtagId = existingHashtag._id
    } else {
      // Create new hashtag
      hashtagId = await ctx.db.insert("hashtags", {
        tag,
        postCount: 1,
        lastUsedAt: now,
        trendingScore: 0,
      })
    }

    // Create post-hashtag link (check for duplicates first)
    const existingLink = await ctx.db
      .query("postHashtags")
      .withIndex("by_post", (q: any) => q.eq("postId", postId))
      .filter((q: any) => q.eq(q.field("hashtagId"), hashtagId))
      .unique()

    if (!existingLink) {
      await ctx.db.insert("postHashtags", {
        postId,
        hashtagId,
        createdAt: now,
      })
    }
  }
}

/**
 * Query: Get trending hashtags
 * Returns top hashtags by post count in the last 24 hours
 */
export const getTrending = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit || 10, 50)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000

    // Get all hashtags used in the last 24h
    const recentHashtags = await ctx.db
      .query("hashtags")
      .filter((q) => q.gte(q.field("lastUsedAt"), oneDayAgo))
      .collect()

    // Sort by post count (descending) and take top N
    const sortedHashtags = recentHashtags
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, limit)

    return sortedHashtags.map((h) => ({
      _id: h._id,
      tag: h.tag,
      postCount: h.postCount,
      lastUsedAt: h.lastUsedAt,
    }))
  },
})

/**
 * Query: Get posts by hashtag (paginated)
 */
export const getPostsByHashtag = query({
  args: {
    tag: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit || 20, 100)
    const normalizedTag = normalizeHashtag(args.tag)

    // Find the hashtag
    const hashtag = await ctx.db
      .query("hashtags")
      .withIndex("by_tag", (q) => q.eq("tag", normalizedTag))
      .unique()

    if (!hashtag) {
      return { posts: [], cursor: null, hashtag: null }
    }

    // Get post-hashtag links
    const links = await ctx.db
      .query("postHashtags")
      .withIndex("by_hashtag", (q) => q.eq("hashtagId", hashtag._id))
      .order("desc")
      .collect()

    // Apply pagination
    const startIndex = args.cursor ? parseInt(args.cursor) : 0
    const paginatedLinks = links.slice(startIndex, startIndex + limit)

    // Fetch post details for each link
    const postsWithAuthors = await Promise.all(
      paginatedLinks.map(async (link) => {
        const post = await ctx.db.get(link.postId)
        if (!post) return null

        const author = await ctx.db.get(post.authorId)
        if (!author) return null

        return {
          _id: post._id,
          authorId: post.authorId,
          content: post.content,
          likeCount: post.likeCount,
          commentCount: post.commentCount,
          shareCount: post.shareCount,
          reactionCounts: post.reactionCounts,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          author: {
            _id: author._id,
            name: author.name,
            profilePicture: author.profilePicture,
            role: author.role,
          },
        }
      })
    )

    // Filter out null values (deleted posts)
    const validPosts = postsWithAuthors.filter((p) => p !== null)

    // Determine next cursor
    const hasMore = startIndex + limit < links.length
    const nextCursor = hasMore ? String(startIndex + limit) : null

    return {
      posts: validPosts,
      cursor: nextCursor,
      hashtag: {
        _id: hashtag._id,
        tag: hashtag.tag,
        postCount: hashtag.postCount,
      },
    }
  },
})

/**
 * Query: Search hashtags for autocomplete
 */
export const searchHashtags = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit || 5, 50)
    const searchTerm = normalizeHashtag(args.query)

    if (searchTerm.length < 1) {
      return []
    }

    // Get all hashtags and filter by prefix
    const allHashtags = await ctx.db.query("hashtags").collect()
    const matchingHashtags = allHashtags
      .filter((h) => h.tag.startsWith(searchTerm))
      .sort((a, b) => b.postCount - a.postCount) // Sort by popularity
      .slice(0, limit)

    return matchingHashtags.map((h) => ({
      _id: h._id,
      tag: h.tag,
      postCount: h.postCount,
    }))
  },
})

/**
 * Mutation: Update trending scores (internal — called by cron job only)
 * Calculate trending score based on recent activity
 */
export const updateTrendingScores = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const oneDayAgo = now - 24 * 60 * 60 * 1000
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000

    // Get all hashtags
    const allHashtags = await ctx.db.query("hashtags").collect()

    for (const hashtag of allHashtags) {
      // Get post count from last 24h
      const recentLinks = await ctx.db
        .query("postHashtags")
        .withIndex("by_hashtag_created", (q) => q.eq("hashtagId", hashtag._id))
        .filter((q) => q.gte(q.field("createdAt"), oneDayAgo))
        .collect()

      const dailyCount = recentLinks.length

      // Get post count from last 7 days
      const weeklyLinks = await ctx.db
        .query("postHashtags")
        .withIndex("by_hashtag_created", (q) => q.eq("hashtagId", hashtag._id))
        .filter((q) => q.gte(q.field("createdAt"), oneWeekAgo))
        .collect()

      const weeklyCount = weeklyLinks.length

      // Calculate trending score: (daily * 3) + weekly
      // This gives more weight to recent posts
      const trendingScore = dailyCount * 3 + weeklyCount

      // Update hashtag
      await ctx.db.patch(hashtag._id, {
        trendingScore,
      })
    }

    return { success: true, updated: allHashtags.length }
  },
})

/**
 * Query: Get hashtag statistics
 */
export const getHashtagStats = query({
  args: {
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedTag = normalizeHashtag(args.tag)

    const hashtag = await ctx.db
      .query("hashtags")
      .withIndex("by_tag", (q) => q.eq("tag", normalizedTag))
      .unique()

    if (!hashtag) {
      return null
    }

    return {
      _id: hashtag._id,
      tag: hashtag.tag,
      postCount: hashtag.postCount,
      lastUsedAt: hashtag.lastUsedAt,
      trendingScore: hashtag.trendingScore || 0,
    }
  },
})

// ──────────────────────────────────────────────
// Internal: Compute trending scores
// ──────────────────────────────────────────────

/**
 * Re-compute trending scores for all hashtags.
 * Score formula: postCount * recencyMultiplier
 * recencyMultiplier = max(0, 1 - (ageInHours / 168)) → decays to 0 over 7 days
 * Called by cron every hour.
 */
export const updateTrendingScores = internalMutation({
  handler: async (ctx) => {
    const now = Date.now()
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000

    // Get all hashtags that have been used in the last 7 days
    const cutoff = now - oneWeekMs
    const hashtags = await ctx.db
      .query("hashtags")
      .filter((q) => q.gte(q.field("lastUsedAt"), cutoff))
      .collect()

    for (const hashtag of hashtags) {
      const ageMs = now - hashtag.lastUsedAt
      const ageHours = ageMs / (60 * 60 * 1000)
      const recencyMultiplier = Math.max(0, 1 - ageHours / 168) // 168h = 7 days

      // Get actual recent post count (last 24h) for velocity boost
      const oneDayAgo = now - 24 * 60 * 60 * 1000
      const recentLinks = await ctx.db
        .query("postHashtags")
        .withIndex("by_hashtag_created", (q) =>
          q.eq("hashtagId", hashtag._id).gte("createdAt", oneDayAgo)
        )
        .collect()

      const recentCount = recentLinks.length
      const score = Math.round(
        (hashtag.postCount * recencyMultiplier + recentCount * 2) * 100
      ) / 100

      await ctx.db.patch(hashtag._id, { trendingScore: score })
    }

    // Zero out scores for hashtags not used in the last 7 days
    const staleHashtags = await ctx.db
      .query("hashtags")
      .filter((q) =>
        q.and(
          q.lt(q.field("lastUsedAt"), cutoff),
          q.gt(q.field("trendingScore"), 0)
        )
      )
      .collect()

    for (const hashtag of staleHashtags) {
      await ctx.db.patch(hashtag._id, { trendingScore: 0 })
    }
  },
})
