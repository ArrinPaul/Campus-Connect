import { v } from "convex/values"
import { query, mutation, internalMutation } from "./_generated/server"
import { Id, Doc } from "./_generated/dataModel"

// ────────────────────────────────────────────
// Scoring weights (Phase 4.1 spec)
// ────────────────────────────────────────────
const WEIGHTS = {
  mutualFollows: 0.3,
  sharedSkills: 0.2,
  sameUniversity: 0.15,
  sameRole: 0.05,
  interactionHistory: 0.2,
  skillComplementarity: 0.1,
} as const

const MAX_SUGGESTIONS_PER_USER = 20

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

/** Jaccard similarity between two string arrays */
function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0
  const setA = new Set(a.map((s) => s.toLowerCase()))
  const setB = new Set(b.map((s) => s.toLowerCase()))
  const intersection = [...setA].filter((x) => setB.has(x)).length
  const union = new Set([...setA, ...setB]).size
  return union === 0 ? 0 : intersection / union
}

/**
 * Skill complementarity: how many skills does candidateUser have that
 * the targetUser does *not* have? Normalised 0-1.
 */
function skillComplementarity(targetSkills: string[], candidateSkills: string[]): number {
  if (candidateSkills.length === 0) return 0
  const targetSet = new Set(targetSkills.map((s) => s.toLowerCase()))
  const complementary = candidateSkills.filter(
    (s) => !targetSet.has(s.toLowerCase())
  ).length
  return complementary / candidateSkills.length
}

/** Build human-readable reason strings */
function buildReasons(
  mutualCount: number,
  sharedSkillsCount: number,
  sameUniversity: boolean,
  sameRole: boolean,
  interactionScore: number,
  complementaryCount: number,
): string[] {
  const reasons: string[] = []
  if (mutualCount > 0)
    reasons.push(`${mutualCount} mutual connection${mutualCount > 1 ? "s" : ""}`)
  if (sharedSkillsCount > 0)
    reasons.push(`${sharedSkillsCount} shared skill${sharedSkillsCount > 1 ? "s" : ""}`)
  if (sameUniversity) reasons.push("Same university")
  if (sameRole) reasons.push("Same role")
  if (interactionScore > 0) reasons.push("Interacted with your posts")
  if (complementaryCount > 0)
    reasons.push(`${complementaryCount} complementary skill${complementaryCount > 1 ? "s" : ""}`)
  if (reasons.length === 0) reasons.push("Suggested for you")
  return reasons
}

// ────────────────────────────────────────────
// Internal: compute suggestions for ONE user
// ────────────────────────────────────────────
export const computeSuggestionsForUser = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) return

    // 1. Get current user's follows
    const myFollows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", user._id))
      .collect()
    const followingIds = new Set(myFollows.map((f) => f.followingId))

    // 2. Get 2nd-degree connections (friends-of-friends)
    const candidateScores = new Map<
      string,
      { mutualCount: number }
    >()

    for (const follow of myFollows) {
      const theirFollows = await ctx.db
        .query("follows")
        .withIndex("by_follower", (q) =>
          q.eq("followerId", follow.followingId)
        )
        .collect()

      for (const ff of theirFollows) {
        const candidateId = ff.followingId as string
        // Skip self and already-followed users
        if (candidateId === (user._id as string) || followingIds.has(ff.followingId))
          continue
        const existing = candidateScores.get(candidateId) ?? { mutualCount: 0 }
        existing.mutualCount += 1
        candidateScores.set(candidateId, existing)
      }
    }

    // 3. If fewer than 20 candidates from graph, add random users by recency
    if (candidateScores.size < MAX_SUGGESTIONS_PER_USER) {
      const recentUsers = await ctx.db
        .query("users")
        .order("desc")
        .take(100)

      for (const u of recentUsers) {
        if (
          (u._id as string) === (user._id as string) ||
          followingIds.has(u._id) ||
          candidateScores.has(u._id as string)
        )
          continue
        candidateScores.set(u._id as string, { mutualCount: 0 })
        if (candidateScores.size >= MAX_SUGGESTIONS_PER_USER * 3) break
      }
    }

    // 4. Get interaction data (reactions + comments on my posts)
    const myPosts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .take(50)

    const interactorCounts = new Map<string, number>()
    for (const post of myPosts) {
      // Reactions on my posts
      const reactions = await ctx.db
        .query("reactions")
        .withIndex("by_target", (q) =>
          q.eq("targetId", post._id as string).eq("targetType", "post")
        )
        .collect()
      for (const r of reactions) {
        const uid = r.userId as string
        interactorCounts.set(uid, (interactorCounts.get(uid) ?? 0) + 1)
      }

      // Comments on my posts
      const comments = await ctx.db
        .query("comments")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .collect()
      for (const c of comments) {
        const uid = c.authorId as string
        interactorCounts.set(uid, (interactorCounts.get(uid) ?? 0) + 2)
      }
    }

    // Also count interactions from the candidate on any of my content
    // Interaction score normaliser (max raw ≈ 20)
    const maxInteraction = Math.max(1, ...interactorCounts.values())

    // 5. Score each candidate
    const scored: Array<{
      candidateId: Id<"users">
      score: number
      reasons: string[]
    }> = []

    for (const [candidateIdStr, { mutualCount }] of candidateScores) {
      const candidateId = candidateIdStr as Id<"users">
      const candidate = await ctx.db.get(candidateId)
      if (!candidate) continue

      // Mutual follows score (normalise: assume 10 mutuals → perfect score)
      const mutualScore = Math.min(1, mutualCount / 10)

      // Shared skills (Jaccard)
      const sharedSkillsScore = jaccardSimilarity(user.skills, candidate.skills)
      const sharedSkillsCount = user.skills.filter((s) =>
        candidate.skills.map((c) => c.toLowerCase()).includes(s.toLowerCase())
      ).length

      // Same university
      const sameUniversity =
        !!user.university &&
        !!candidate.university &&
        user.university.toLowerCase() === candidate.university.toLowerCase()
      const universityScore = sameUniversity ? 1 : 0

      // Same role
      const sameRole = user.role === candidate.role
      const roleScore = sameRole ? 1 : 0

      // Interaction history
      const rawInteraction = interactorCounts.get(candidateIdStr) ?? 0
      const interactionScore = rawInteraction / maxInteraction

      // Skill complementarity
      const complementarityScore = skillComplementarity(
        user.skills,
        candidate.skills
      )
      const complementaryCount = candidate.skills.filter(
        (s) => !user.skills.map((u) => u.toLowerCase()).includes(s.toLowerCase())
      ).length

      // Weighted composite score
      const score =
        WEIGHTS.mutualFollows * mutualScore +
        WEIGHTS.sharedSkills * sharedSkillsScore +
        WEIGHTS.sameUniversity * universityScore +
        WEIGHTS.sameRole * roleScore +
        WEIGHTS.interactionHistory * interactionScore +
        WEIGHTS.skillComplementarity * complementarityScore

      const reasons = buildReasons(
        mutualCount,
        sharedSkillsCount,
        sameUniversity,
        sameRole,
        rawInteraction,
        complementaryCount
      )

      scored.push({ candidateId, score, reasons })
    }

    // 6. Sort by score descending, take top N
    scored.sort((a, b) => b.score - a.score)
    const topSuggestions = scored.slice(0, MAX_SUGGESTIONS_PER_USER)

    // 7. Delete old suggestions for this user
    const oldSuggestions = await ctx.db
      .query("suggestions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()
    for (const old of oldSuggestions) {
      await ctx.db.delete(old._id)
    }

    // 8. Insert new suggestions
    const now = Date.now()
    for (const suggestion of topSuggestions) {
      await ctx.db.insert("suggestions", {
        userId: user._id,
        suggestedUserId: suggestion.candidateId,
        score: suggestion.score,
        reasons: suggestion.reasons,
        isDismissed: false,
        computedAt: now,
      })
    }
  },
})

// ────────────────────────────────────────────
// Internal: batch compute for all active users
// (called by cron every 6 hours)
// ────────────────────────────────────────────
export const computeAllSuggestions = internalMutation({
  args: {},
  handler: async (ctx) => {
    // "Active" = has presence in the last 7 days, or has posted in the last 7 days
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

    const allUsers = await ctx.db.query("users").collect()
    const activeUsers = allUsers.filter(
      (u) =>
        (u.lastSeenAt && u.lastSeenAt > sevenDaysAgo) ||
        (u.updatedAt && u.updatedAt > sevenDaysAgo)
    )

    // Process each active user inline (Convex mutations run in a single transaction)
    // For large deployments this should be split into scheduled actions.
    // For campus-scale (< 10k users) this is fine.
    for (const user of activeUsers) {
      // Inline the computation for each user within the same mutation
      // to avoid scheduling overhead
      await computeSuggestionsForUserInline(ctx, user._id)
    }
  },
})

/**
 * Inline helper that does the same computation as computeSuggestionsForUser
 * but accepts the ctx directly (no separate mutation scheduling needed).
 */
async function computeSuggestionsForUserInline(
  ctx: any,
  userId: Id<"users">
) {
  const user = await ctx.db.get(userId)
  if (!user) return

  const myFollows = await ctx.db
    .query("follows")
    .withIndex("by_follower", (q: any) => q.eq("followerId", userId))
    .collect()
  const followingIds = new Set(myFollows.map((f: any) => f.followingId))

  // 2nd-degree connections
  const candidateScores = new Map<string, { mutualCount: number }>()
  for (const follow of myFollows) {
    const theirFollows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q: any) =>
        q.eq("followerId", follow.followingId)
      )
      .collect()
    for (const ff of theirFollows) {
      const cid = ff.followingId as string
      if (cid === (userId as string) || followingIds.has(ff.followingId)) continue
      const e = candidateScores.get(cid) ?? { mutualCount: 0 }
      e.mutualCount += 1
      candidateScores.set(cid, e)
    }
  }

  // Pad with recent users
  if (candidateScores.size < MAX_SUGGESTIONS_PER_USER) {
    const recentUsers = await ctx.db.query("users").order("desc").take(100)
    for (const u of recentUsers) {
      if (
        (u._id as string) === (userId as string) ||
        followingIds.has(u._id) ||
        candidateScores.has(u._id as string)
      ) continue
      candidateScores.set(u._id as string, { mutualCount: 0 })
      if (candidateScores.size >= MAX_SUGGESTIONS_PER_USER * 3) break
    }
  }

  // Interactions
  const myPosts = await ctx.db
    .query("posts")
    .withIndex("by_author", (q: any) => q.eq("authorId", userId))
    .take(50)
  const interactorCounts = new Map<string, number>()
  for (const post of myPosts) {
    const reactions = await ctx.db
      .query("reactions")
      .withIndex("by_target", (q: any) =>
        q.eq("targetId", post._id as string).eq("targetType", "post")
      )
      .collect()
    for (const r of reactions) {
      interactorCounts.set(r.userId as string, (interactorCounts.get(r.userId as string) ?? 0) + 1)
    }
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q: any) => q.eq("postId", post._id))
      .collect()
    for (const c of comments) {
      interactorCounts.set(c.authorId as string, (interactorCounts.get(c.authorId as string) ?? 0) + 2)
    }
  }
  const maxInteraction = Math.max(1, ...interactorCounts.values())

  // Score
  const scored: Array<{ candidateId: Id<"users">; score: number; reasons: string[] }> = []
  for (const [cidStr, { mutualCount }] of candidateScores) {
    const candidate = await ctx.db.get(cidStr as Id<"users">)
    if (!candidate) continue

    const mutualScore = Math.min(1, mutualCount / 10)
    const sharedSkillsScore = jaccardSimilarity(user.skills, candidate.skills)
    const sharedSkillsCount = user.skills.filter((s: string) =>
      candidate.skills.map((c: string) => c.toLowerCase()).includes(s.toLowerCase())
    ).length
    const sameUniversity =
      !!user.university && !!candidate.university &&
      user.university.toLowerCase() === candidate.university.toLowerCase()
    const sameRole = user.role === candidate.role
    const rawInteraction = interactorCounts.get(cidStr) ?? 0
    const interactionScore = rawInteraction / maxInteraction
    const complementarityScore = skillComplementarity(user.skills, candidate.skills)
    const complementaryCount = candidate.skills.filter(
      (s: string) => !user.skills.map((u: string) => u.toLowerCase()).includes(s.toLowerCase())
    ).length

    const score =
      WEIGHTS.mutualFollows * mutualScore +
      WEIGHTS.sharedSkills * sharedSkillsScore +
      WEIGHTS.sameUniversity * (sameUniversity ? 1 : 0) +
      WEIGHTS.sameRole * (sameRole ? 1 : 0) +
      WEIGHTS.interactionHistory * interactionScore +
      WEIGHTS.skillComplementarity * complementarityScore

    scored.push({
      candidateId: cidStr as Id<"users">,
      score,
      reasons: buildReasons(
        mutualCount, sharedSkillsCount, sameUniversity, sameRole,
        rawInteraction, complementaryCount
      ),
    })
  }

  scored.sort((a, b) => b.score - a.score)
  const top = scored.slice(0, MAX_SUGGESTIONS_PER_USER)

  // Delete old
  const old = await ctx.db
    .query("suggestions")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .collect()
  for (const o of old) {
    await ctx.db.delete(o._id)
  }

  // Insert new
  const now = Date.now()
  for (const s of top) {
    await ctx.db.insert("suggestions", {
      userId,
      suggestedUserId: s.candidateId,
      score: s.score,
      reasons: s.reasons,
      isDismissed: false,
      computedAt: now,
    })
  }
}

// ────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────

/**
 * Get friend suggestions for the current user.
 * Returns non-dismissed suggestions sorted by score (descending).
 */
export const getSuggestions = query({
  args: {
    limit: v.optional(v.number()),
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

    const suggestions = await ctx.db
      .query("suggestions")
      .withIndex("by_user_dismissed", (q) =>
        q.eq("userId", user._id).eq("isDismissed", false)
      )
      .collect()

    // Sort by score descending (index doesn't sort by score)
    suggestions.sort((a, b) => b.score - a.score)

    const topSuggestions = suggestions.slice(0, limit)

    // Enrich with user data
    const enriched = await Promise.all(
      topSuggestions.map(async (s) => {
        const suggestedUser = await ctx.db.get(s.suggestedUserId)
        return {
          _id: s._id,
          score: s.score,
          reasons: s.reasons,
          computedAt: s.computedAt,
          user: suggestedUser
            ? {
                _id: suggestedUser._id,
                name: suggestedUser.name,
                username: suggestedUser.username,
                profilePicture: suggestedUser.profilePicture,
                bio: suggestedUser.bio,
                university: suggestedUser.university,
                role: suggestedUser.role,
                skills: suggestedUser.skills,
              }
            : null,
        }
      })
    )

    return enriched.filter((s) => s.user !== null)
  },
})

/**
 * Dismiss a suggestion so it no longer appears.
 */
export const dismissSuggestion = mutation({
  args: {
    suggestionId: v.id("suggestions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()
    if (!user) throw new Error("User not found")

    const suggestion = await ctx.db.get(args.suggestionId)
    if (!suggestion) throw new Error("Suggestion not found")

    // Only the recipient can dismiss their own suggestions
    if (suggestion.userId !== user._id) {
      throw new Error("Not authorized to dismiss this suggestion")
    }

    await ctx.db.patch(args.suggestionId, { isDismissed: true })
    return { success: true }
  },
})

/**
 * Manually trigger re-computation of suggestions for the requesting user.
 * This is a mutation that computes inline (synchronous).
 */
export const refreshSuggestions = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()
    if (!user) throw new Error("User not found")

    // Run inline computation
    await computeSuggestionsForUserInline(ctx, user._id)
    return { success: true }
  },
})

// ────────────────────────────────────────────
// Exported helpers for testing
// ────────────────────────────────────────────
export { jaccardSimilarity, skillComplementarity, buildReasons, WEIGHTS }
