import { v } from "convex/values"
import { query } from "./_generated/server"
import { jaccardSimilarity } from "./math_utils"

// ────────────────────────────────────────────
// Skill-Based Matching (Phase 4.5)
// Find experts, study partners, and mentors
// based on skill overlap & complementarity.
// ────────────────────────────────────────────

// ── Scoring helpers (exported for testing) ──

/**
 * Jaccard similarity between two skill sets.
 * Returns value in [0, 1]. 0 = no overlap, 1 = identical.
 */
export function skillOverlap(a: string[], b: string[]): number {
  return jaccardSimilarity(a, b)
}

/**
 * Complementarity score: measures how many skills B has that A lacks.
 * Normalized as fraction of B's skills that are unique to B.
 * Returns [0, 1]. Higher → B fills more gaps in A's knowledge.
 */
export function complementarity(a: string[], b: string[]): number {
  const setA = new Set(a.map((s) => s.toLowerCase()))
  const setB = new Set(b.map((s) => s.toLowerCase()))
  if (setB.size === 0) return 0
  let uniqueToB = 0
  for (const s of Array.from(setB)) {
    if (!setA.has(s)) uniqueToB++
  }
  return uniqueToB / setB.size
}

/**
 * Experience level numeric value for comparison.
 */
export function experienceLevelValue(
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert"
): number {
  switch (level) {
    case "Beginner":
      return 1
    case "Intermediate":
      return 2
    case "Advanced":
      return 3
    case "Expert":
      return 4
  }
}

/**
 * Expert score: combines skill match, endorsement count, and experience level.
 * Returns [0, 1].
 */
export function expertScore(
  querySkills: string[],
  candidateSkills: string[],
  candidateLevel: "Beginner" | "Intermediate" | "Advanced" | "Expert",
  endorsementCount: number
): number {
  const overlap = skillOverlap(querySkills, candidateSkills)
  const levelScore = experienceLevelValue(candidateLevel) / 4
  const endorseScore = Math.min(1, endorsementCount / 20) // normalized to 20

  // Weights: skill match 0.50, experience 0.30, endorsements 0.20
  return overlap * 0.5 + levelScore * 0.3 + endorseScore * 0.2
}

/**
 * Partner score: combines complementarity and overlap for study partners.
 * Good partners have some overlap (common ground) plus complementary skills.
 * Returns [0, 1].
 */
export function partnerScore(
  viewerSkills: string[],
  candidateSkills: string[]
): number {
  const overlap = skillOverlap(viewerSkills, candidateSkills)
  const comp = complementarity(viewerSkills, candidateSkills)

  // Best partners have moderate overlap + high complementarity
  // Weights: complementarity 0.55, overlap 0.45
  return comp * 0.55 + overlap * 0.45
}

// ────────────────────────────────────────────
// Queries
// ────────────────────────────────────────────

/**
 * Find experts for given skills with optional experience level filter.
 * Results sorted by expertScore (descending).
 */
export const findExperts = query({
  args: {
    skills: v.array(v.string()), // skills to search for
    experienceLevel: v.optional(
      v.union(
        v.literal("Beginner"),
        v.literal("Intermediate"),
        v.literal("Advanced"),
        v.literal("Expert")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()
    if (!currentUser) throw new Error("User not found")

    if (args.skills.length === 0)
      return { items: [], totalCount: 0 }

    const limit = Math.min(args.limit ?? 20, 100)
    const querySkillsLower = args.skills.map((s) => s.toLowerCase())

    // Find users whose skills intersect with the query skills
    const allUsers = await ctx.db.query("users").take(1000)
    const candidates = allUsers.filter((u) => {
      if (u._id === currentUser._id) return false
      // Must have at least one matching skill
      return u.skills.some((s) => querySkillsLower.includes(s.toLowerCase()))
    })

    // Experience level filter
    const filtered = args.experienceLevel
      ? candidates.filter((u) => u.experienceLevel === args.experienceLevel)
      : candidates

    // Get endorsement counts for candidates on matched skills
    const scored = await Promise.all(
      filtered.map(async (user) => {
        // Count endorsements for matched skills
        const endorsements = await ctx.db
          .query("skillEndorsements")
          .filter((q) => q.eq(q.field("userId"), user._id))
          .collect()

        const matchedEndorsements = endorsements.filter((e) =>
          querySkillsLower.includes(e.skillName)
        ).length

        const score = expertScore(
          args.skills,
          user.skills,
          user.experienceLevel,
          matchedEndorsements
        )

        return {
          user: {
            _id: user._id,
            name: user.name,
            username: user.username,
            profilePicture: user.profilePicture,
            role: user.role,
            university: user.university,
            experienceLevel: user.experienceLevel,
            skills: user.skills,
          },
          score,
          endorsementCount: matchedEndorsements,
          matchedSkills: user.skills.filter((s) =>
            querySkillsLower.includes(s.toLowerCase())
          ),
        }
      })
    )

    scored.sort((a, b) => b.score - a.score)
    const items = scored.slice(0, limit)

    return { items, totalCount: scored.length }
  },
})

/**
 * Find study partners — users with complementary skills.
 * Good partners share some common ground but also bring new skills.
 */
export const findStudyPartners = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()
    if (!currentUser) throw new Error("User not found")

    if (currentUser.skills.length === 0)
      return { items: [], totalCount: 0 }

    const limit = Math.min(args.limit ?? 20, 100)

    const allUsers = await ctx.db.query("users").take(1000)
    const candidates = allUsers.filter((u) => {
      if (u._id === currentUser._id) return false
      // Must have at least one skill
      return u.skills.length > 0
    })

    const scored = candidates.map((user) => {
      const score = partnerScore(currentUser.skills, user.skills)
      const comp = complementarity(currentUser.skills, user.skills)
      const overlap = skillOverlap(currentUser.skills, user.skills)

      // Find which skills they'd bring to the partnership
      const viewerSkillsLower = new Set(
        currentUser.skills.map((s) => s.toLowerCase())
      )
      const complementarySkills = user.skills.filter(
        (s) => !viewerSkillsLower.has(s.toLowerCase())
      )
      const sharedSkills = user.skills.filter((s) =>
        viewerSkillsLower.has(s.toLowerCase())
      )

      return {
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          profilePicture: user.profilePicture,
          role: user.role,
          university: user.university,
          experienceLevel: user.experienceLevel,
          skills: user.skills,
        },
        score,
        complementarySkills,
        sharedSkills,
        complementarityRatio: comp,
        overlapRatio: overlap,
      }
    })

    // Filter out users with zero score
    const filtered = scored.filter((s) => s.score > 0)
    filtered.sort((a, b) => b.score - a.score)
    const items = filtered.slice(0, limit)

    return { items, totalCount: filtered.length }
  },
})

/**
 * Find mentors — more experienced users with matching skills.
 * Best for beginners/intermediate users looking for guidance.
 */
export const findMentors = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()
    if (!currentUser) throw new Error("User not found")

    if (currentUser.skills.length === 0)
      return { items: [], totalCount: 0 }

    const limit = Math.min(args.limit ?? 20, 100)
    const viewerLevel = experienceLevelValue(currentUser.experienceLevel)
    const viewerSkillsLower = currentUser.skills.map((s) => s.toLowerCase())

    const allUsers = await ctx.db.query("users").take(1000)

    const candidates = allUsers.filter((u) => {
      if (u._id === currentUser._id) return false
      // Mentor must have higher experience level
      if (experienceLevelValue(u.experienceLevel) <= viewerLevel) return false
      // Must share at least one skill
      return u.skills.some((s) => viewerSkillsLower.includes(s.toLowerCase()))
    })

    const scored = await Promise.all(
      candidates.map(async (user) => {
        // Get total endorsement count for shared skills
        const endorsements = await ctx.db
          .query("skillEndorsements")
          .filter((q) => q.eq(q.field("userId"), user._id))
          .collect()

        const matchedEndorsements = endorsements.filter((e) =>
          viewerSkillsLower.includes(e.skillName)
        ).length

        const overlap = skillOverlap(currentUser.skills, user.skills)
        const levelGap =
          (experienceLevelValue(user.experienceLevel) - viewerLevel) / 3 // max gap is 3
        const endorseScore = Math.min(1, matchedEndorsements / 15)

        // Mentor score: 40% skill overlap, 35% experience gap, 25% endorsements
        const score = overlap * 0.4 + levelGap * 0.35 + endorseScore * 0.25

        const sharedSkills = user.skills.filter((s) =>
          viewerSkillsLower.includes(s.toLowerCase())
        )

        return {
          user: {
            _id: user._id,
            name: user.name,
            username: user.username,
            profilePicture: user.profilePicture,
            role: user.role,
            university: user.university,
            experienceLevel: user.experienceLevel,
            skills: user.skills,
          },
          score,
          sharedSkills,
          endorsementCount: matchedEndorsements,
          experienceGap: experienceLevelValue(user.experienceLevel) - viewerLevel,
        }
      })
    )

    scored.sort((a, b) => b.score - a.score)
    const items = scored.slice(0, limit)

    return { items, totalCount: scored.length }
  },
})
