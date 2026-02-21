import { v } from "convex/values"
import { query, mutation, internalMutation } from "./_generated/server"

// ──────────────────────────────────────────────
// Auth helper
// ──────────────────────────────────────────────
async function getAuthUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error("Unauthorized")
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
    .unique()
  if (!user) throw new Error("User not found")
  return user
}

// ──────────────────────────────────────────────
// Reputation rules
// ──────────────────────────────────────────────
export const REPUTATION_RULES: Record<string, number> = {
  post_created: 10,
  comment_created: 5,
  receive_like: 1,
  receive_comment: 2,
  skill_endorsed: 3,
  answer_accepted: 15,
  paper_uploaded: 10,
  resource_uploaded: 5,
  question_asked: 3,
  answer_posted: 5,
}

/**
 * Calculate level from reputation: level = floor(sqrt(reputation / 10))
 * Minimum level is 1
 */
export function calculateLevel(reputation: number): number {
  if (reputation <= 0) return 1
  return Math.max(1, Math.floor(Math.sqrt(reputation / 10)))
}

// ──────────────────────────────────────────────
// Achievement definitions
// ──────────────────────────────────────────────
export const ACHIEVEMENT_DEFINITIONS = [
  { badge: "first_post", name: "First Post", description: "Published your first post" },
  { badge: "first_comment", name: "Commentator", description: "Left your first comment" },
  { badge: "popular_post", name: "Trending", description: "Got 10+ likes on a post" },
  { badge: "helpful", name: "Helpful", description: "Had an answer accepted" },
  { badge: "scholar", name: "Scholar", description: "Uploaded a research paper" },
  { badge: "teacher", name: "Teacher", description: "Shared a study resource" },
  { badge: "questioner", name: "Curious Mind", description: "Asked 10 questions" },
  { badge: "contributor", name: "Top Contributor", description: "Reached 100 reputation" },
  { badge: "expert", name: "Expert", description: "Reached 500 reputation" },
  { badge: "legend", name: "Legend", description: "Reached 1000 reputation" },
  { badge: "networker", name: "Networker", description: "Followed 20 people" },
  { badge: "endorsed", name: "Endorsed", description: "Received 5 skill endorsements" },
  { badge: "level_5", name: "Level 5", description: "Reached level 5" },
  { badge: "level_10", name: "Level 10", description: "Reached level 10" },
]

// ──────────────────────────────────────────────
// Mutations
// ──────────────────────────────────────────────

/**
 * Award reputation to a user (internal — called by other mutations)
 */
export const awardReputation = internalMutation({
  args: {
    userId: v.id("users"),
    action: v.string(),
    amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) return

    const points = args.amount ?? REPUTATION_RULES[args.action] ?? 0
    if (points === 0) return

    const newReputation = (user.reputation ?? 0) + points
    const newLevel = calculateLevel(newReputation)

    await ctx.db.patch(args.userId, {
      reputation: newReputation,
      level: newLevel,
    })

    return { reputation: newReputation, level: newLevel }
  },
})

/**
 * Unlock an achievement badge for a user (internal — called by system only)
 */
export const unlockAchievement = internalMutation({
  args: {
    userId: v.id("users"),
    badge: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if already earned
    const existing = await ctx.db
      .query("achievements")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .collect()

    if (existing.some((a) => a.badge === args.badge)) {
      return null // Already earned
    }

    const definition = ACHIEVEMENT_DEFINITIONS.find((d) => d.badge === args.badge)
    if (!definition) throw new Error("Unknown achievement badge")

    return ctx.db.insert("achievements", {
      userId: args.userId,
      badge: args.badge,
      name: definition.name,
      description: definition.description,
      earnedAt: Date.now(),
    })
  },
})

/**
 * Check and award achievements based on user stats (internal — called by system only)
 * Called after significant events
 */
export const checkAchievements = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) return []

    const earned = await ctx.db
      .query("achievements")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .collect()
    const earnedBadges = new Set(earned.map((a) => a.badge))
    const newAchievements: string[] = []

    const reputation = user.reputation ?? 0

    // Reputation milestones
    if (reputation >= 100 && !earnedBadges.has("contributor")) {
      newAchievements.push("contributor")
    }
    if (reputation >= 500 && !earnedBadges.has("expert")) {
      newAchievements.push("expert")
    }
    if (reputation >= 1000 && !earnedBadges.has("legend")) {
      newAchievements.push("legend")
    }

    // Level milestones
    const level = user.level ?? 1
    if (level >= 5 && !earnedBadges.has("level_5")) {
      newAchievements.push("level_5")
    }
    if (level >= 10 && !earnedBadges.has("level_10")) {
      newAchievements.push("level_10")
    }

    // ── Activity-based achievements ──

    // first_post: Published your first post
    if (!earnedBadges.has("first_post")) {
      const postCount = (await ctx.db
        .query("posts")
        .withIndex("by_author", (q: any) => q.eq("authorId", args.userId))
        .take(1)).length
      if (postCount > 0) newAchievements.push("first_post")
    }

    // first_comment: Left your first comment
    if (!earnedBadges.has("first_comment")) {
      const commentCount = (await ctx.db
        .query("comments")
        .withIndex("by_author", (q: any) => q.eq("authorId", args.userId))
        .take(1)).length
      if (commentCount > 0) newAchievements.push("first_comment")
    }

    // popular_post: Got 10+ likes on a post
    if (!earnedBadges.has("popular_post")) {
      const popularPost = await ctx.db
        .query("posts")
        .withIndex("by_author", (q: any) => q.eq("authorId", args.userId))
        .filter((q: any) => q.gte(q.field("likeCount"), 10))
        .first()
      if (popularPost) newAchievements.push("popular_post")
    }

    // helpful: Had an answer accepted
    if (!earnedBadges.has("helpful")) {
      const acceptedAnswer = await ctx.db
        .query("answers")
        .withIndex("by_answered_by", (q: any) => q.eq("answeredBy", args.userId))
        .filter((q: any) => q.eq(q.field("isAccepted"), true))
        .first()
      if (acceptedAnswer) newAchievements.push("helpful")
    }

    // scholar: Uploaded a research paper
    if (!earnedBadges.has("scholar")) {
      const paper = (await ctx.db
        .query("papers")
        .withIndex("by_uploaded_by", (q: any) => q.eq("uploadedBy", args.userId))
        .take(1)).length
      if (paper > 0) newAchievements.push("scholar")
    }

    // teacher: Shared a study resource
    if (!earnedBadges.has("teacher")) {
      const resource = (await ctx.db
        .query("resources")
        .withIndex("by_uploaded_by", (q: any) => q.eq("uploadedBy", args.userId))
        .take(1)).length
      if (resource > 0) newAchievements.push("teacher")
    }

    // questioner: Asked 10 questions
    if (!earnedBadges.has("questioner")) {
      const questionCount = (await ctx.db
        .query("questions")
        .withIndex("by_asked_by", (q: any) => q.eq("askedBy", args.userId))
        .take(10)).length
      if (questionCount >= 10) newAchievements.push("questioner")
    }

    // networker: Followed 20 people
    if (!earnedBadges.has("networker")) {
      const followCount = (await ctx.db
        .query("follows")
        .withIndex("by_follower", (q: any) => q.eq("followerId", args.userId))
        .take(20)).length
      if (followCount >= 20) newAchievements.push("networker")
    }

    // endorsed: Received 5 skill endorsements
    if (!earnedBadges.has("endorsed")) {
      const endorsements = await ctx.db
        .query("skillEndorsements")
        .withIndex("by_user_skill", (q: any) => q.eq("userId", args.userId))
        .take(5)
      if (endorsements.length >= 5) newAchievements.push("endorsed")
    }

    // Insert new achievements
    for (const badge of newAchievements) {
      const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.badge === badge)
      if (def) {
        await ctx.db.insert("achievements", {
          userId: args.userId,
          badge,
          name: def.name,
          description: def.description,
          earnedAt: Date.now(),
        })
      }
    }

    return newAchievements
  },
})

// ──────────────────────────────────────────────
// Queries
// ──────────────────────────────────────────────

/**
 * Get a user's earned achievements
 */
export const getAchievements = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const achievements = await ctx.db
      .query("achievements")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .collect()

    // Sort by earned date desc
    achievements.sort((a, b) => b.earnedAt - a.earnedAt)

    return {
      earned: achievements,
      all: ACHIEVEMENT_DEFINITIONS.map((def) => ({
        ...def,
        earned: achievements.some((a) => a.badge === def.badge),
        earnedAt: achievements.find((a) => a.badge === def.badge)?.earnedAt,
      })),
    }
  },
})

/**
 * Get leaderboard — top users by reputation
 */
export const getLeaderboard = query({
  args: {
    period: v.optional(v.union(v.literal("weekly"), v.literal("monthly"), v.literal("all"))),
    university: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100)

    let users = await ctx.db.query("users").collect()

    // Filter by university
    if (args.university) {
      const uni = args.university.toLowerCase()
      users = users.filter(
        (u) => u.university && u.university.toLowerCase().includes(uni)
      )
    }

    // Sort by reputation desc
    users.sort((a, b) => (b.reputation ?? 0) - (a.reputation ?? 0))

    // Take top N
    const topUsers = users.slice(0, limit)

    return Promise.all(
      topUsers.map(async (user, index) => {
        const achievements = await ctx.db
          .query("achievements")
          .withIndex("by_user", (q: any) => q.eq("userId", user._id))
          .collect()

        return {
          rank: index + 1,
          _id: user._id,
          name: user.name,
          username: user.username,
          profilePicture: user.profilePicture,
          university: user.university,
          reputation: user.reputation ?? 0,
          level: user.level ?? 1,
          achievementCount: achievements.length,
        }
      })
    )
  },
})

/**
 * Get current user's reputation and level
 */
export const getMyReputation = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique()
    if (!user) return null

    const reputation = user.reputation ?? 0
    const level = user.level ?? 1
    const nextLevel = level + 1
    const repForNextLevel = nextLevel * nextLevel * 10
    const progress = Math.min(100, Math.round((reputation / repForNextLevel) * 100))

    return {
      reputation,
      level,
      nextLevel,
      repForNextLevel,
      progress,
    }
  },
})
