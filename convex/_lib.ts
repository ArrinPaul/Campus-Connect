/**
 * Shared backend utilities for Convex mutations and queries.
 */

import { Id } from "./_generated/dataModel"

// ─── Auth helpers ─────────────────────────────────────────────────────────────

/**
 * Gets the Convex user document for the currently authenticated user.
 * Throws an error if the user is not authenticated or not found in the database.
 */
export async function getAuthenticatedUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized: No user identity found.");
  
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
    .unique();
    
  if (!user) throw new Error("User not found in database.");
  
  return user;
}

/**
 * A stricter version of getAuthenticatedUser that also checks for onboarding completion.
 * Throws a specific 'ONBOARDING_REQUIRED' error if the user has not completed onboarding.
 */
export async function requireOnboarding(ctx: any) {
    const user = await getAuthenticatedUser(ctx);
    if (!user.onboardingComplete) {
        throw new Error("ONBOARDING_REQUIRED");
    }
    return user;
}

/**
 * Same as getAuthenticatedUser but returns null instead of throwing.
 */
export async function getAuthenticatedUserOrNull(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  
  return await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
    .unique() as Promise<any | null>;
}

// ─── Rate limiting ────────────────────────────────────────────────────────────

export async function checkRateLimit(
  ctx: any,
  userId: Id<"users">,
  action: string,
  { windowMs, maxHits }: { windowMs: number; maxHits: number }
): Promise<void> {
  const now = Date.now();

  const existing = await ctx.db
    .query("rateLimits")
    .withIndex("by_user_action", (q: any) =>
      q.eq("userId", userId).eq("action", action)
    )
    .unique();

  if (!existing) {
    await ctx.db.insert("rateLimits", {
      userId,
      action,
      windowStart: now,
      count: 1,
    });
    return;
  }

  if (now - existing.windowStart >= windowMs) {
    await ctx.db.patch(existing._id, { windowStart: now, count: 1 });
    return;
  }

  if (existing.count >= maxHits) {
    const msLeft = existing.windowStart + windowMs - now;
    const sLeft = Math.ceil(msLeft / 1000);
    throw new Error(
      `Too many requests. Please wait ${sLeft} second${sLeft !== 1 ? "s" : ""} before trying again.`
    );
  }

  await ctx.db.patch(existing._id, { count: existing.count + 1 });
}

export const RATE_LIMITS = {
  createPost:     { windowMs: 60_000,  maxHits: 10  },
  createComment:  { windowMs: 60_000,  maxHits: 20  },
  sendMessage:    { windowMs: 60_000,  maxHits: 40  },
  followUser:     { windowMs: 300_000, maxHits: 50  },
  addReaction:    { windowMs: 60_000,  maxHits: 60  },
  postJob:        { windowMs: 3_600_000, maxHits: 5 },
  askQuestion:    { windowMs: 60_000,  maxHits: 10  },
  postAnswer:     { windowMs: 60_000,  maxHits: 20  },
  createRepost:   { windowMs: 60_000,  maxHits: 30  },
  uploadPaper:    { windowMs: 3_600_000, maxHits: 5 },
} as const;
