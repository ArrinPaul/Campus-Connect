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
// Pro plan features definition
// ──────────────────────────────────────────────
export const PRO_FEATURES = [
  { key: "advanced_search", label: "Advanced Search Filters", description: "Filter by role, university, skills, and more" },
  { key: "profile_analytics", label: "Profile Analytics", description: "See who viewed your profile" },
  { key: "larger_uploads", label: "Larger File Uploads", description: "Upload files up to 100MB (Free: 25MB)" },
  { key: "custom_themes", label: "Custom Profile Themes", description: "Stand out with a custom profile design" },
  { key: "priority_support", label: "Priority Support", description: "Get help faster with dedicated support" },
  { key: "unlimited_messages", label: "Unlimited DMs", description: "No limits on direct messages (Free: 100/day)" },
  { key: "export_data", label: "Data Export", description: "Export your posts, connections, and activity" },
  { key: "pro_badge", label: "Pro Badge", description: "Verified Pro badge on your profile" },
]

export const PRICING = {
  monthly: { amount: 999, currency: "usd", interval: "month", label: "$9.99/month" },
  yearly: { amount: 7999, currency: "usd", interval: "year", label: "$79.99/year" },
}

// ──────────────────────────────────────────────
// Mutations
// ──────────────────────────────────────────────

/**
 * Initiate a Pro upgrade (creates pending subscription record)
 * In production, this would create a Stripe checkout session
 */
export const upgradeToPro = mutation({
  args: {
    plan: v.union(v.literal("monthly"), v.literal("yearly")),
    stripeSessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)

    // Check if already Pro
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .unique()

    const now = Date.now()
    const periodEnd =
      args.plan === "monthly"
        ? now + 30 * 24 * 60 * 60 * 1000
        : now + 365 * 24 * 60 * 60 * 1000

    if (existing) {
      await ctx.db.patch(existing._id, {
        plan: "pro",
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        updatedAt: now,
      })
    } else {
      await ctx.db.insert("subscriptions", {
        userId: user._id,
        plan: "pro",
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        createdAt: now,
        updatedAt: now,
      })
    }

    // Mark user as Pro
    await ctx.db.patch(user._id, {
      isPro: true,
      proExpiresAt: periodEnd,
    })

    return { success: true, expiresAt: periodEnd }
  },
})

/**
 * Cancel Pro subscription (cancels at period end)
 */
export const cancelPro = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx)

    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .unique()

    if (!sub || sub.plan !== "pro") {
      throw new Error("No active Pro subscription found")
    }

    await ctx.db.patch(sub._id, {
      cancelAtPeriodEnd: true,
      status: "cancelled",
      updatedAt: Date.now(),
    })

    // Will revert isPro when period ends (webhook in production)
    await ctx.db.patch(user._id, { isPro: false, proExpiresAt: undefined })

    return { success: true }
  },
})

/**
 * Handle Stripe webhook events (internal)
 */
export const handleStripeWebhook = internalMutation({
  args: {
    eventType: v.string(),
    stripeSubscriptionId: v.string(),
    stripeCustomerId: v.string(),
    status: v.string(),
    currentPeriodEnd: v.number(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_sub", (q: any) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId)
      )
      .unique()

    if (!sub) return

    if (args.eventType === "customer.subscription.deleted") {
      await ctx.db.patch(sub._id, {
        status: "cancelled",
        plan: "free",
        updatedAt: Date.now(),
      })
      const user = await ctx.db.get(sub.userId)
      if (user) {
        await ctx.db.patch(sub.userId, { isPro: false, proExpiresAt: undefined })
      }
    } else if (args.eventType === "customer.subscription.updated") {
      await ctx.db.patch(sub._id, {
        status: args.status === "active" ? "active" : "past_due",
        currentPeriodEnd: args.currentPeriodEnd,
        updatedAt: Date.now(),
      })
    }
  },
})

// ──────────────────────────────────────────────
// Queries
// ──────────────────────────────────────────────

/**
 * Get current user's Pro status and subscription details
 */
export const checkProStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique()
    if (!user) return null

    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .unique()

    const now = Date.now()
    const isPro = user.isPro && user.proExpiresAt && user.proExpiresAt > now

    return {
      isPro: !!isPro,
      isVerified: user.isVerified ?? false,
      subscription: sub
        ? {
            plan: sub.plan,
            status: sub.status,
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
            currentPeriodEnd: sub.currentPeriodEnd,
            daysRemaining: sub.currentPeriodEnd
              ? Math.max(0, Math.ceil((sub.currentPeriodEnd - now) / (1000 * 60 * 60 * 24)))
              : null,
          }
        : null,
    }
  },
})

/**
 * Check if a user is Pro (for feature gating)
 */
export const isUserPro = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) return false
    return !!(user.isPro && user.proExpiresAt && user.proExpiresAt > Date.now())
  },
})
