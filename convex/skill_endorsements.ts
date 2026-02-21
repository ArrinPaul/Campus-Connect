import { v } from "convex/values"
import { query, mutation } from "./_generated/server"

// ────────────────────────────────────────────
// Skill Endorsements (Phase 4.5)
// Allow users to endorse skills on other users' profiles.
// ────────────────────────────────────────────

/**
 * Endorse a skill on another user's profile.
 * - Cannot endorse your own skills
 * - Cannot endorse a skill the user doesn't have
 * - Cannot endorse the same skill twice
 */
export const endorseSkill = mutation({
  args: {
    userId: v.id("users"),
    skillName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()
    if (!currentUser) throw new Error("User not found")

    // Prevent self-endorsement
    if (currentUser._id === args.userId) {
      throw new Error("Cannot endorse your own skills")
    }

    // Verify target user exists
    const targetUser = await ctx.db.get(args.userId)
    if (!targetUser) throw new Error("User not found")

    // Verify the user actually has this skill
    const normalizedSkill = args.skillName.trim().toLowerCase()
    const userHasSkill = targetUser.skills.some(
      (s) => s.toLowerCase() === normalizedSkill
    )
    if (!userHasSkill) {
      throw new Error("User does not have this skill")
    }

    // Check for duplicate endorsement
    const existing = await ctx.db
      .query("skillEndorsements")
      .withIndex("by_user_skill_endorser", (q) =>
        q
          .eq("userId", args.userId)
          .eq("skillName", normalizedSkill)
          .eq("endorserId", currentUser._id)
      )
      .unique()

    if (existing) {
      throw new Error("You have already endorsed this skill")
    }

    return await ctx.db.insert("skillEndorsements", {
      skillName: normalizedSkill,
      userId: args.userId,
      endorserId: currentUser._id,
      createdAt: Date.now(),
    })
  },
})

/**
 * Remove an endorsement you previously gave.
 */
export const removeEndorsement = mutation({
  args: {
    userId: v.id("users"),
    skillName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()
    if (!currentUser) throw new Error("User not found")

    const normalizedSkill = args.skillName.trim().toLowerCase()

    const existing = await ctx.db
      .query("skillEndorsements")
      .withIndex("by_user_skill_endorser", (q) =>
        q
          .eq("userId", args.userId)
          .eq("skillName", normalizedSkill)
          .eq("endorserId", currentUser._id)
      )
      .unique()

    if (!existing) {
      throw new Error("Endorsement not found")
    }

    await ctx.db.delete(existing._id)
  },
})

/**
 * Get endorsement counts for all skills of a user, plus which skills
 * the current viewer has endorsed.
 */
export const getEndorsements = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()

    const targetUser = await ctx.db.get(args.userId)
    if (!targetUser) return { skills: [] }

    // Get all endorsements for this user
    const allEndorsements = await ctx.db
      .query("skillEndorsements")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect()

    // Group by skill
    const skillMap = new Map<
      string,
      { count: number; endorsedByViewer: boolean; topEndorsers: string[] }
    >()

    for (const skill of targetUser.skills) {
      const normalizedSkill = skill.toLowerCase()
      const endorsementsForSkill = allEndorsements.filter(
        (e) => e.skillName === normalizedSkill
      )

      // Get top 3 endorser names
      const endorserIds = endorsementsForSkill
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 3)
        .map((e) => e.endorserId)

      const endorserNames: string[] = []
      for (const eid of endorserIds) {
        const eUser = await ctx.db.get(eid)
        if (eUser) endorserNames.push(eUser.name)
      }

      const endorsedByViewer = currentUser
        ? endorsementsForSkill.some((e) => e.endorserId === currentUser._id)
        : false

      skillMap.set(skill, {
        count: endorsementsForSkill.length,
        endorsedByViewer,
        topEndorsers: endorserNames,
      })
    }

    return {
      skills: targetUser.skills.map((skill) => ({
        name: skill,
        ...(skillMap.get(skill) ?? {
          count: 0,
          endorsedByViewer: false,
          topEndorsers: [],
        }),
      })),
    }
  },
})

/**
 * Get all endorsements given by the current user.
 */
export const getMyEndorsements = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()
    if (!currentUser) return []

    return await ctx.db
      .query("skillEndorsements")
      .withIndex("by_endorser", (q) => q.eq("endorserId", currentUser._id))
      .collect()
  },
})
