import { v } from "convex/values"
import { query } from "./_generated/server"
import { Id, Doc } from "./_generated/dataModel"

// ────────────────────────────────────────────
// Feed Ranking Config (Phase 4.2)
// ────────────────────────────────────────────

/** Decay half-life in hours for recency scoring */
const RECENCY_HALF_LIFE_HOURS = 24

/** Maximum age (in hours) before a post scores ~0 for recency */
const MAX_POST_AGE_HOURS = 168 // 7 days

/** Author diversity: max posts from same author in the first N results */
const MAX_POSTS_PER_AUTHOR = 2
const DIVERSITY_WINDOW = 20

// ────────────────────────────────────────────
// Scoring Functions (exported for testing)
// ────────────────────────────────────────────

/**
 * Recency score: exponential decay based on hours since post.
 * Returns value in [0, 1]. Brand-new post → ~1, 24h old → ~0.5, 7d+ → ~0
 */
export function recencyScore(postCreatedAt: number, now: number): number {
  const ageMs = now - postCreatedAt
  if (ageMs <= 0) return 1
  const ageHours = ageMs / (1000 * 60 * 60)
  if (ageHours >= MAX_POST_AGE_HOURS) return 0
  // Exponential decay: score = 2^(-ageHours / halfLife)
  return Math.pow(2, -ageHours / RECENCY_HALF_LIFE_HOURS)
}

/**
 * Relevance score: Jaccard similarity of viewer skills vs author skills.
 * Returns value in [0, 1].
 */
export function relevanceScore(viewerSkills: string[], authorSkills: string[]): number {
  if (viewerSkills.length === 0 && authorSkills.length === 0) return 0
  const setA = new Set(viewerSkills.map((s) => s.toLowerCase()))
  const setB = new Set(authorSkills.map((s) => s.toLowerCase()))
  const intersection = [...setA].filter((x) => setB.has(x)).length
  const union = new Set([...setA, ...setB]).size
  return union === 0 ? 0 : intersection / union
}

/**
 * Engagement score: logarithmic score based on reactions, comments, and shares.
 * Formula: log2(1 + likes + 2*comments + 3*shares)
 * Returns value normalised to roughly [0, 1] (capped at 1).
 */
export function engagementScore(
  reactionCounts: { like: number; love: number; laugh: number; wow: number; sad: number; scholarly: number } | undefined,
  commentCount: number,
  shareCount: number
): number {
  const totalReactions = reactionCounts
    ? reactionCounts.like +
      reactionCounts.love +
      reactionCounts.laugh +
      reactionCounts.wow +
      reactionCounts.sad +
      reactionCounts.scholarly
    : 0
  const raw = totalReactions + 2 * commentCount + 3 * shareCount
  // log2(1 + raw) normalised: assume 100 engagement ≈ perfect score
  const score = Math.log2(1 + raw) / Math.log2(101) // log2(101) ≈ 6.66
  return Math.min(1, score)
}

/**
 * Relationship score: how frequently the viewer has interacted with this author.
 * interactionCount = number of reactions/comments the viewer has made on this author's posts.
 * Normalised: assume 10 interactions → perfect score.
 * Returns value in [0, 1].
 */
export function relationshipScore(interactionCount: number): number {
  return Math.min(1, interactionCount / 10)
}

/**
 * Compute the composite feed score for a post.
 */
export function computeFeedScore(params: {
  recency: number
  relevance: number
  engagement: number
  relationship: number
}): number {
  // Weights for the composite score
  const WEIGHTS = {
    recency: 0.35,
    relevance: 0.20,
    engagement: 0.25,
    relationship: 0.20,
  }

  return (
    WEIGHTS.recency * params.recency +
    WEIGHTS.relevance * params.relevance +
    WEIGHTS.engagement * params.engagement +
    WEIGHTS.relationship * params.relationship
  )
}

/** The weights exported for testing */
export const FEED_WEIGHTS = {
  recency: 0.35,
  relevance: 0.20,
  engagement: 0.25,
  relationship: 0.20,
}

// ────────────────────────────────────────────
// Author diversity enforcement
// ────────────────────────────────────────────
function enforceAuthorDiversity<T extends { authorId: string }>(
  items: T[],
  maxPerAuthor: number,
  window: number
): T[] {
  const authorCounts = new Map<string, number>()
  const result: T[] = []
  const deferred: T[] = []

  for (const item of items) {
    const count = authorCounts.get(item.authorId) ?? 0
    if (result.length < window && count >= maxPerAuthor) {
      // Defer this item — too many from same author in the diversity window
      deferred.push(item)
    } else {
      result.push(item)
      authorCounts.set(item.authorId, count + 1)
    }
  }

  // Append deferred items after the diversity window
  return [...result, ...deferred]
}

// ────────────────────────────────────────────
// Public API: Ranked Feed ("For You")
// ────────────────────────────────────────────
export const getRankedFeed = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()
    if (!user) throw new Error("User not found")

    const limit = Math.min(args.limit ?? 20, 100)
    const now = Date.now()

    // 1. Fetch recent posts (up to 7 days — anything older scores ~0 anyway)
    const cutoffTime = now - MAX_POST_AGE_HOURS * 60 * 60 * 1000
    const recentPosts = await ctx.db
      .query("posts")
      .withIndex("by_createdAt")
      .order("desc")
      .filter((q) => q.gte(q.field("createdAt"), cutoffTime))
      .take(200) // Pool of candidates

    // 2. Precompute relationship data: viewer's reactions/comments on each author
    const interactionsByAuthor = new Map<string, number>()

    // Get viewer's recent reactions
    const myReactions = await ctx.db
      .query("reactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(200)

    for (const reaction of myReactions) {
      if (reaction.targetType === "post") {
        // Look up the post to get its author
        const post = await ctx.db.get(reaction.targetId as Id<"posts">)
        if (post) {
          const authorId = post.authorId as string
          interactionsByAuthor.set(
            authorId,
            (interactionsByAuthor.get(authorId) ?? 0) + 1
          )
        }
      }
    }

    // Get viewer's recent comments and count per post author
    const myComments = await ctx.db
      .query("comments")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .take(200)

    for (const comment of myComments) {
      const post = await ctx.db.get(comment.postId)
      if (post) {
        const authorId = post.authorId as string
        interactionsByAuthor.set(
          authorId,
          (interactionsByAuthor.get(authorId) ?? 0) + 1
        )
      }
    }

    // 3. Score each post
    const scoredPosts = await Promise.all(
      recentPosts.map(async (post) => {
        const author = await ctx.db.get(post.authorId)
        if (!author) return null

        const recency = recencyScore(post.createdAt, now)
        const relevance = relevanceScore(user.skills, author.skills)
        const engagement = engagementScore(
          post.reactionCounts as any,
          post.commentCount,
          post.shareCount
        )
        const relationship = relationshipScore(
          interactionsByAuthor.get(post.authorId as string) ?? 0
        )

        const score = computeFeedScore({
          recency,
          relevance,
          engagement,
          relationship,
        })

        return {
          type: "post" as const,
          _id: post._id,
          createdAt: post.createdAt,
          authorId: post.authorId as string,
          score,
          post: {
            ...post,
            author,
          },
        }
      })
    )

    // Filter nulls, sort by score
    const validPosts = scoredPosts.filter((p) => p !== null) as NonNullable<
      (typeof scoredPosts)[number]
    >[]
    validPosts.sort((a, b) => b.score - a.score)

    // 4. Enforce author diversity
    const diversified = enforceAuthorDiversity(validPosts, MAX_POSTS_PER_AUTHOR, DIVERSITY_WINDOW)

    // 5. Apply cursor-based pagination (cursor = index offset as string)
    const startIndex = args.cursor ? Math.max(0, parseInt(args.cursor, 10) || 0) : 0
    const page = diversified.slice(startIndex, startIndex + limit + 1)
    const hasMore = page.length > limit
    const itemsToReturn = hasMore ? page.slice(0, limit) : page

    const nextCursor = hasMore ? String(startIndex + limit) : null

    return {
      items: itemsToReturn.map(({ score, authorId: _aid, ...rest }) => rest),
      nextCursor,
      hasMore,
    }
  },
})

// ────────────────────────────────────────────
// Public API: Chronological Feed ("Following")
// This simply wraps the existing getUnifiedFeed
// ────────────────────────────────────────────
export const getChronologicalFeed = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()
    if (!user) throw new Error("User not found")

    const limit = Math.min(args.limit ?? 20, 100)

    // Get following list
    const followingList = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", user._id))
      .collect()
    const followingIds = followingList.map((f) => f.followingId)

    // Posts from followed users (chronological, newest first)
    let postsQuery = ctx.db
      .query("posts")
      .withIndex("by_createdAt")
      .order("desc")

    if (followingIds.length > 0) {
      postsQuery = postsQuery.filter((q) =>
        q.or(...followingIds.map((id) => q.eq(q.field("authorId"), id)))
      )
    }

    const posts = await postsQuery.take(limit * 2)

    // Reposts from followed users
    let repostsQuery = ctx.db
      .query("reposts")
      .withIndex("by_createdAt")
      .order("desc")

    if (followingIds.length > 0) {
      repostsQuery = repostsQuery.filter((q) =>
        q.or(...followingIds.map((id) => q.eq(q.field("userId"), id)))
      )
    }

    const reposts = await repostsQuery.take(limit * 2)

    // Combine
    const postItems = await Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db.get(post.authorId)
        return {
          type: "post" as const,
          _id: post._id,
          createdAt: post.createdAt,
          post: { ...post, author: author || null },
        }
      })
    )

    const repostItems = await Promise.all(
      reposts.map(async (repost) => {
        const reposter = await ctx.db.get(repost.userId)
        const originalPost = await ctx.db.get(repost.originalPostId)
        if (!originalPost) return null
        const originalAuthor = await ctx.db.get(originalPost.authorId)
        return {
          type: "repost" as const,
          _id: repost._id,
          createdAt: repost.createdAt,
          reposter: reposter || null,
          quoteContent: repost.quoteContent,
          post: { ...originalPost, author: originalAuthor || null },
        }
      })
    )

    const allItems = [...postItems, ...repostItems.filter((i) => i !== null)]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit + 1)

    const hasMore = allItems.length > limit
    const itemsToReturn = hasMore ? allItems.slice(0, limit) : allItems

    return {
      items: itemsToReturn,
      nextCursor: hasMore
        ? String(itemsToReturn[itemsToReturn.length - 1].createdAt)
        : null,
      hasMore,
    }
  },
})

// ────────────────────────────────────────────
// Public API: Trending Feed (campus-wide)
// ────────────────────────────────────────────
export const getTrendingFeed = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()
    if (!user) throw new Error("User not found")

    const limit = Math.min(args.limit ?? 20, 100)
    const now = Date.now()

    // Trending = posts from last 48 hours, sorted by engagement
    const cutoff48h = now - 48 * 60 * 60 * 1000
    const recentPosts = await ctx.db
      .query("posts")
      .withIndex("by_createdAt")
      .order("desc")
      .filter((q) => q.gte(q.field("createdAt"), cutoff48h))
      .take(200)

    // Score by engagement + slight recency boost
    const scored = await Promise.all(
      recentPosts.map(async (post) => {
        const author = await ctx.db.get(post.authorId)
        if (!author) return null

        const eng = engagementScore(
          post.reactionCounts as any,
          post.commentCount,
          post.shareCount
        )
        const rec = recencyScore(post.createdAt, now)
        // Trending score: 70% engagement + 30% recency
        const trendingScore = 0.7 * eng + 0.3 * rec

        return {
          type: "post" as const,
          _id: post._id,
          createdAt: post.createdAt,
          authorId: post.authorId as string,
          score: trendingScore,
          post: { ...post, author },
        }
      })
    )

    const valid = scored.filter((p) => p !== null) as NonNullable<
      (typeof scored)[number]
    >[]
    valid.sort((a, b) => b.score - a.score)

    // Enforce diversity
    const diversified = enforceAuthorDiversity(valid, MAX_POSTS_PER_AUTHOR, DIVERSITY_WINDOW)

    // Paginate
    const startIndex = args.cursor ? Math.max(0, parseInt(args.cursor, 10) || 0) : 0
    const page = diversified.slice(startIndex, startIndex + limit + 1)
    const hasMore = page.length > limit
    const itemsToReturn = hasMore ? page.slice(0, limit) : page

    return {
      items: itemsToReturn.map(({ score, authorId: _aid, ...rest }) => rest),
      nextCursor: hasMore ? String(startIndex + limit) : null,
      hasMore,
    }
  },
})
