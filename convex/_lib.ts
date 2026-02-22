/**
 * Shared backend utilities for Convex mutations and queries.
 *
 * Provides:
 *  - getAuthenticatedUser  — single auth+user lookup, replaces 15 duplicated helpers
 *  - checkRateLimit        — sliding-window rate limiter for mutations
 */

import { Id } from "./_generated/dataModel"

// ─── Auth helper ─────────────────────────────────────────────────────────────

/**
 * Resolve the currently authenticated Clerk identity to a Convex user document.
 * Throws "Unauthorized" if no identity, throws "User not found" if user missing.
 *
 * Usage:
 *   const user = await getAuthenticatedUser(ctx)
 */
export async function getAuthenticatedUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error("Unauthorized")
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
    .unique()
  if (!user) throw new Error("User not found")
  return user
}

/**
 * Same as getAuthenticatedUser but returns null instead of throwing.
 * Use in queries where unauthenticated access should gracefully return null/[].
 */
export async function getAuthenticatedUserOrNull(ctx: any) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) return null
  return ctx.db
    .query("users")
    .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
    .unique() as Promise<any | null>
}

// ─── Rate limiting ────────────────────────────────────────────────────────────

/**
 * Sliding-window rate limiter backed by the `rateLimits` table.
 * Must be called from a mutation (requires write access).
 *
 * Throws an error with the remaining wait time if the limit is exceeded.
 *
 * @param ctx      - Convex mutation context
 * @param userId   - The user performing the action
 * @param action   - String key identifying the action (e.g., "createPost")
 * @param opts     - windowMs: sliding window length; maxHits: max actions per window
 *
 * Usage:
 *   await checkRateLimit(ctx, user._id, "createPost", { windowMs: 60_000, maxHits: 10 })
 */
export async function checkRateLimit(
  ctx: any,
  userId: Id<"users">,
  action: string,
  { windowMs, maxHits }: { windowMs: number; maxHits: number }
): Promise<void> {
  const now = Date.now()

  const existing = await ctx.db
    .query("rateLimits")
    .withIndex("by_user_action", (q: any) =>
      q.eq("userId", userId).eq("action", action)
    )
    .unique()

  if (!existing) {
    await ctx.db.insert("rateLimits", {
      userId,
      action,
      windowStart: now,
      count: 1,
    })
    return
  }

  // Window has expired — reset the counter
  if (now - existing.windowStart >= windowMs) {
    await ctx.db.patch(existing._id, { windowStart: now, count: 1 })
    return
  }

  // Within window — check count
  if (existing.count >= maxHits) {
    const msLeft = existing.windowStart + windowMs - now
    const sLeft = Math.ceil(msLeft / 1000)
    throw new Error(
      `Too many requests. Please wait ${sLeft} second${sLeft !== 1 ? "s" : ""} before trying again.`
    )
  }

  // Under limit — increment
  await ctx.db.patch(existing._id, { count: existing.count + 1 })
}

// ─── Rate limit presets (shared constants) ──────────────────────────────────

export const RATE_LIMITS = {
  createPost:     { windowMs: 60_000,  maxHits: 10  }, // 10 posts / min
  createComment:  { windowMs: 60_000,  maxHits: 20  }, // 20 comments / min
  sendMessage:    { windowMs: 60_000,  maxHits: 40  }, // 40 messages / min
  followUser:     { windowMs: 300_000, maxHits: 50  }, // 50 follows / 5 min
  addReaction:    { windowMs: 60_000,  maxHits: 60  }, // 60 reactions / min
  createRepost:   { windowMs: 60_000,  maxHits: 10  }, // 10 reposts / min
  postJob:        { windowMs: 3_600_000, maxHits: 5 }, // 5 job posts / hour
  uploadPaper:    { windowMs: 3_600_000, maxHits: 5 }, // 5 papers / hour
  askQuestion:    { windowMs: 300_000, maxHits: 10  }, // 10 questions / 5 min
  postAnswer:     { windowMs: 300_000, maxHits: 20  }, // 20 answers / 5 min
} as const
