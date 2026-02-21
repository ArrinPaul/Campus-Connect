import { v } from "convex/values"
import { query } from "./_generated/server"
import { Id, Doc } from "./_generated/dataModel"
import { jaccardSimilarity } from "./math_utils"

// ────────────────────────────────────────────
// Content Recommendation Engine (Phase 4.3)
// ────────────────────────────────────────────

// ── Scoring helpers (exported for testing) ──

/**
 * Topic affinity: Jaccard similarity between two arrays of hashtag IDs.
 * Returns value in [0, 1].
 */
export function topicAffinity(viewerHashtags: string[], postHashtags: string[]): number {
  return jaccardSimilarity(viewerHashtags, postHashtags)
}

/**
 * Author affinity: how much the viewer has interacted with this author (likes, comments).
 * Normalised: assume 15 interactions → perfect score.
 */
export function authorAffinity(interactionCount: number): number {
  return Math.min(1, interactionCount / 15)
}

/**
 * Freshness boost: exponential decay with 48‑hour half-life.
 * Returns value in [0, 1]. Posts older than 14 days → 0.
 */
export function freshnessBoost(postCreatedAt: number, now: number): number {
  const ageMs = now - postCreatedAt
  if (ageMs <= 0) return 1
  const ageHours = ageMs / (1000 * 60 * 60)
  const MAX_AGE_HOURS = 336 // 14 days
  if (ageHours >= MAX_AGE_HOURS) return 0
  const HALF_LIFE_HOURS = 48
  return Math.pow(2, -ageHours / HALF_LIFE_HOURS)
}

/**
 * Engagement quality ratio: quality of engagement (comments are heavier than reactions).
 * Formula: log2(1 + reactions + 3*comments) / log2(201)
 * Returns value in [0, 1].
 */
export function engagementQuality(
  reactionCounts: { like: number; love: number; laugh: number; wow: number; sad: number; scholarly: number } | undefined,
  commentCount: number
): number {
  const totalReactions = reactionCounts
    ? reactionCounts.like +
      reactionCounts.love +
      reactionCounts.laugh +
      reactionCounts.wow +
      reactionCounts.sad +
      reactionCounts.scholarly
    : 0
  const raw = totalReactions + 3 * commentCount
  return Math.min(1, Math.log2(1 + raw) / Math.log2(201))
}

/** Scoring weights for content recommendation */
export const REC_WEIGHTS = {
  topicAffinity: 0.30,
  authorAffinity: 0.25,
  freshness: 0.20,
  engagementQuality: 0.25,
} as const

/**
 * Compute composite recommendation score.
 */
export function computeRecommendationScore(params: {
  topicAffinity: number
  authorAffinity: number
  freshness: number
  engagementQuality: number
}): number {
  return (
    REC_WEIGHTS.topicAffinity * params.topicAffinity +
    REC_WEIGHTS.authorAffinity * params.authorAffinity +
    REC_WEIGHTS.freshness * params.freshness +
    REC_WEIGHTS.engagementQuality * params.engagementQuality
  )
}

// ────────────────────────────────────────────
// Query: getRecommendedPosts (content-based filtering)
// "Posts you might like" – scored using topic + author + freshness + engagement
// ────────────────────────────────────────────
export const getRecommendedPosts = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return { items: [], nextCursor: null, hasMore: false }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()
    if (!user) throw new Error("User not found")

    const limit = Math.min(args.limit ?? 10, 50)
    const now = Date.now()

    // 1. Gather viewer context: hashtags they've interacted with + authors they interact with
    // -- Viewer's own posts' hashtags (topic fingerprint)
    const myPosts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .order("desc")
      .take(50)

    const myPostIds = new Set(myPosts.map((p) => p._id as string))

    const viewerHashtagSet = new Set<string>()
    for (const post of myPosts) {
      const links = await ctx.db
        .query("postHashtags")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .collect()
      for (const link of links) {
        viewerHashtagSet.add(link.hashtagId as string)
      }
    }

    // -- Viewer's reactions → figure out which authors & hashtags they engage with
    const myReactions = await ctx.db
      .query("reactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(200)

    const interactionsByAuthor = new Map<string, number>()
    const reactedPostIds = new Set<string>()

    for (const reaction of myReactions) {
      if (reaction.targetType === "post") {
        const post = await ctx.db.get(reaction.targetId as Id<"posts">)
        if (post) {
          reactedPostIds.add(post._id as string)
          const authorId = post.authorId as string
          interactionsByAuthor.set(authorId, (interactionsByAuthor.get(authorId) ?? 0) + 1)
          // Also gather hashtags from posts user liked
          const links = await ctx.db
            .query("postHashtags")
            .withIndex("by_post", (q) => q.eq("postId", post._id))
            .collect()
          for (const link of links) {
            viewerHashtagSet.add(link.hashtagId as string)
          }
        }
      }
    }

    // -- Viewer's comments → author interaction counts
    const myComments = await ctx.db
      .query("comments")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .take(200)

    for (const comment of myComments) {
      const post = await ctx.db.get(comment.postId)
      if (post) {
        const authorId = post.authorId as string
        interactionsByAuthor.set(authorId, (interactionsByAuthor.get(authorId) ?? 0) + 1)
      }
    }

    const viewerHashtags = Array.from(viewerHashtagSet)

    // 2. Candidate pool: recent posts NOT authored by viewer and NOT already reacted to
    const cutoff = now - 14 * 24 * 60 * 60 * 1000 // 14 days
    const candidates = await ctx.db
      .query("posts")
      .withIndex("by_createdAt")
      .order("desc")
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), cutoff),
          q.neq(q.field("authorId"), user._id)
        )
      )
      .take(300)

    // Filter out posts the viewer has already interacted with
    const unseenCandidates = candidates.filter(
      (p) => !reactedPostIds.has(p._id as string) && !myPostIds.has(p._id as string)
    )

    // 3. Score each post
    const scoredPosts = await Promise.all(
      unseenCandidates.map(async (post) => {
        const author = await ctx.db.get(post.authorId)
        if (!author) return null

        // Topic affinity
        const postLinks = await ctx.db
          .query("postHashtags")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .collect()
        const postHashtagIds = postLinks.map((l) => l.hashtagId as string)
        const topic = topicAffinity(viewerHashtags, postHashtagIds)

        // Author affinity
        const authorAff = authorAffinity(
          interactionsByAuthor.get(post.authorId as string) ?? 0
        )

        // Freshness
        const freshness = freshnessBoost(post.createdAt, now)

        // Engagement quality
        const engQuality = engagementQuality(
          post.reactionCounts as any,
          post.commentCount
        )

        const score = computeRecommendationScore({
          topicAffinity: topic,
          authorAffinity: authorAff,
          freshness,
          engagementQuality: engQuality,
        })

        return {
          type: "post" as const,
          _id: post._id,
          createdAt: post.createdAt,
          authorId: post.authorId as string,
          score,
          post: { ...post, author },
        }
      })
    )

    const valid = scoredPosts.filter((p) => p !== null) as NonNullable<(typeof scoredPosts)[number]>[]
    valid.sort((a, b) => b.score - a.score)

    // Pagination with offset cursor
    const startIndex = args.cursor ? parseInt(args.cursor, 10) : 0
    const page = valid.slice(startIndex, startIndex + limit + 1)
    const hasMore = page.length > limit
    const items = hasMore ? page.slice(0, limit) : page

    return {
      items: items.map(({ score, authorId: _aid, ...rest }) => rest),
      nextCursor: hasMore ? String(startIndex + limit) : null,
      hasMore,
    }
  },
})

// ────────────────────────────────────────────
// Query: getSimilarPosts (collaborative filtering)
// "Users who liked X also liked Y"
// ────────────────────────────────────────────
export const getSimilarPosts = query({
  args: {
    postId: v.id("posts"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return { items: [], hasMore: false }

    const limit = Math.min(args.limit ?? 5, 50)

    // 1. Get users who reacted to this post
    const postReactions = await ctx.db
      .query("reactions")
      .withIndex("by_target", (q) =>
        q.eq("targetId", args.postId as string).eq("targetType", "post")
      )
      .take(100)

    const reactorIds = Array.from(new Set(postReactions.map((r) => r.userId)))

    if (reactorIds.length === 0) {
      return { items: [], hasMore: false }
    }

    // 2. For each reactor, find other posts they reacted to
    const coReactedPostCounts = new Map<string, number>()

    for (const reactorId of reactorIds.slice(0, 30)) {
      // limit to 30 reactors for performance
      const theirReactions = await ctx.db
        .query("reactions")
        .withIndex("by_user", (q) => q.eq("userId", reactorId))
        .filter((q) => q.eq(q.field("targetType"), "post"))
        .take(100)

      for (const reaction of theirReactions) {
        const targetPostId = reaction.targetId
        if (targetPostId !== (args.postId as string)) {
          coReactedPostCounts.set(
            targetPostId,
            (coReactedPostCounts.get(targetPostId) ?? 0) + 1
          )
        }
      }
    }

    // 3. Sort by co-reaction frequency
    const sorted = Array.from(coReactedPostCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)

    // 4. Hydrate
    const items = await Promise.all(
      sorted.map(async ([postIdStr]) => {
        const post = await ctx.db.get(postIdStr as Id<"posts">)
        if (!post) return null
        const author = await ctx.db.get(post.authorId)
        return {
          type: "post" as const,
          _id: post._id,
          createdAt: post.createdAt,
          post: { ...post, author: author || null },
          coReactionCount: coReactedPostCounts.get(postIdStr) ?? 0,
        }
      })
    )

    return {
      items: items.filter((i) => i !== null),
      hasMore: false,
    }
  },
})

// ────────────────────────────────────────────
// Query: getTrendingInSkill
// Posts trending within the user's skill areas
// ────────────────────────────────────────────
export const getTrendingInSkill = query({
  args: {
    skill: v.optional(v.string()), // specific skill, or uses viewer's skills
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return { items: [], skills: [], hasMore: false }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()
    if (!user) throw new Error("User not found")

    const limit = Math.min(args.limit ?? 10, 50)
    const now = Date.now()

    // Determine skill(s) to search for
    const targetSkills = args.skill
      ? [args.skill.toLowerCase()]
      : user.skills.map((s) => s.toLowerCase())

    if (targetSkills.length === 0) {
      return { items: [], skills: [], hasMore: false }
    }

    // Get posts from last 7 days by authors who share the skill(s)
    const cutoff = now - 7 * 24 * 60 * 60 * 1000
    const recentPosts = await ctx.db
      .query("posts")
      .withIndex("by_createdAt")
      .order("desc")
      .filter((q) => q.gte(q.field("createdAt"), cutoff))
      .take(300)

    // Score each: does the author have the target skill + engagement
    const scored = await Promise.all(
      recentPosts.map(async (post) => {
        const author = await ctx.db.get(post.authorId)
        if (!author) return null

        const authorSkillsLower = author.skills.map((s) => s.toLowerCase())
        const matchingSkills = targetSkills.filter((s) =>
          authorSkillsLower.includes(s)
        )
        if (matchingSkills.length === 0) return null

        const totalReactions = post.reactionCounts
          ? post.reactionCounts.like +
            post.reactionCounts.love +
            post.reactionCounts.laugh +
            post.reactionCounts.wow +
            post.reactionCounts.sad +
            post.reactionCounts.scholarly
          : 0
        const engScore =
          Math.log2(1 + totalReactions + 2 * post.commentCount + 3 * post.shareCount) /
          Math.log2(101)

        const recScore = freshnessBoost(post.createdAt, now)
        const trendingScore = 0.7 * Math.min(1, engScore) + 0.3 * recScore

        return {
          type: "post" as const,
          _id: post._id,
          createdAt: post.createdAt,
          matchingSkills,
          score: trendingScore,
          post: { ...post, author },
        }
      })
    )

    const valid = scored.filter((p) => p !== null) as NonNullable<(typeof scored)[number]>[]
    valid.sort((a, b) => b.score - a.score)

    const items = valid.slice(0, limit)
    const skills = Array.from(new Set(items.flatMap((i) => i.matchingSkills)))

    return {
      items: items.map(({ score, matchingSkills, ...rest }) => rest),
      skills,
      hasMore: valid.length > limit,
    }
  },
})

// ────────────────────────────────────────────
// Query: getPopularInUniversity
// Posts popular within the viewer's university
// ────────────────────────────────────────────
export const getPopularInUniversity = query({
  args: {
    university: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return { items: [], university: "", hasMore: false }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()
    if (!user) throw new Error("User not found")

    const limit = Math.min(args.limit ?? 10, 50)
    const now = Date.now()

    const targetUniversity = (args.university ?? user.university ?? "").toLowerCase()
    if (!targetUniversity) {
      return { items: [], university: "", hasMore: false }
    }

    // Get posts from last 7 days
    const cutoff = now - 7 * 24 * 60 * 60 * 1000
    const recentPosts = await ctx.db
      .query("posts")
      .withIndex("by_createdAt")
      .order("desc")
      .filter((q) => q.gte(q.field("createdAt"), cutoff))
      .take(300)

    // Filter by university match
    const scored = await Promise.all(
      recentPosts.map(async (post) => {
        const author = await ctx.db.get(post.authorId)
        if (!author) return null
        if ((author.university ?? "").toLowerCase() !== targetUniversity) return null

        const totalReactions = post.reactionCounts
          ? post.reactionCounts.like +
            post.reactionCounts.love +
            post.reactionCounts.laugh +
            post.reactionCounts.wow +
            post.reactionCounts.sad +
            post.reactionCounts.scholarly
          : 0
        const engScore =
          Math.log2(1 + totalReactions + 2 * post.commentCount + 3 * post.shareCount) /
          Math.log2(101)

        return {
          type: "post" as const,
          _id: post._id,
          createdAt: post.createdAt,
          score: engScore,
          post: { ...post, author },
        }
      })
    )

    const valid = scored.filter((p) => p !== null) as NonNullable<(typeof scored)[number]>[]
    valid.sort((a, b) => b.score - a.score)

    const items = valid.slice(0, limit)

    return {
      items: items.map(({ score, ...rest }) => rest),
      university: targetUniversity,
      hasMore: valid.length > limit,
    }
  },
})
