import { v } from "convex/values"
import { query, mutation } from "./_generated/server"

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
// Validation helpers
// ──────────────────────────────────────────────
export function validateAdTitle(title: string): void {
  if (!title.trim()) throw new Error("Title is required")
  if (title.length > 200) throw new Error("Title must be 200 characters or fewer")
}

export function validateAdContent(content: string): void {
  if (!content.trim()) throw new Error("Content is required")
  if (content.length > 2000) throw new Error("Content must be 2000 characters or fewer")
}

export function validateBudget(budget: number): void {
  if (budget <= 0) throw new Error("Budget must be greater than 0")
  if (!Number.isFinite(budget)) throw new Error("Budget must be a valid number")
}

export function validateLinkUrl(url: string): void {
  if (!url.trim()) throw new Error("Link URL is required")
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error("Link URL is not a valid URL")
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Link URL must use http or https")
  }
}

export function calcCtr(impressions: number, clicks: number): number {
  if (impressions === 0) return 0
  return Math.round((clicks / impressions) * 10000) / 100 // round to 2dp
}

export function matchesTargeting(
  ad: { targetUniversity?: string; targetRole?: string; targetSkills?: string[] },
  user: { university?: string; role?: string; skills?: string[] }
): boolean {
  if (ad.targetUniversity && ad.targetUniversity !== user.university) return false
  if (ad.targetRole && ad.targetRole !== user.role) return false
  if (ad.targetSkills && ad.targetSkills.length > 0) {
    const userSkills = user.skills ?? []
    const hasMatchingSkill = ad.targetSkills.some((s) => userSkills.includes(s))
    if (!hasMatchingSkill) return false
  }
  return true
}

// ──────────────────────────────────────────────
// Mutations
// ──────────────────────────────────────────────

export const createAd = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    imageUrl: v.optional(v.string()),
    linkUrl: v.string(),
    targetUniversity: v.optional(v.string()),
    targetRole: v.optional(v.string()),
    targetSkills: v.optional(v.array(v.string())),
    budget: v.number(),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    validateAdTitle(args.title)
    validateAdContent(args.content)
    validateBudget(args.budget)
    validateLinkUrl(args.linkUrl)
    if (args.targetSkills && args.targetSkills.length > 20) throw new Error("Maximum 20 target skills")

    const adId = await ctx.db.insert("ads", {
      title: args.title,
      content: args.content,
      imageUrl: args.imageUrl,
      linkUrl: args.linkUrl,
      advertiserId: user._id,
      targetUniversity: args.targetUniversity,
      targetRole: args.targetRole,
      targetSkills: args.targetSkills,
      budget: args.budget,
      impressions: 0,
      clicks: 0,
      status: "active",
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
    })
    return adId
  },
})

export const updateAd = mutation({
  args: {
    adId: v.id("ads"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    linkUrl: v.optional(v.string()),
    targetUniversity: v.optional(v.string()),
    targetRole: v.optional(v.string()),
    targetSkills: v.optional(v.array(v.string())),
    budget: v.optional(v.number()),
    status: v.optional(v.union(v.literal("active"), v.literal("paused"), v.literal("expired"))),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const ad = await ctx.db.get(args.adId)
    if (!ad) throw new Error("Ad not found")
    if (ad.advertiserId.toString() !== user._id.toString()) throw new Error("Unauthorized")

    if (args.title !== undefined) validateAdTitle(args.title)
    if (args.content !== undefined) validateAdContent(args.content)
    if (args.budget !== undefined) validateBudget(args.budget)
    if (args.linkUrl !== undefined) validateLinkUrl(args.linkUrl)

    const { adId, ...rest } = args
    const updates: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(rest)) {
      if (val !== undefined) updates[key] = val
    }
    await ctx.db.patch(adId, updates)
    return { success: true }
  },
})

export const deleteAd = mutation({
  args: { adId: v.id("ads") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const ad = await ctx.db.get(args.adId)
    if (!ad) throw new Error("Ad not found")
    if (ad.advertiserId.toString() !== user._id.toString()) throw new Error("Unauthorized")

    // Cascade: delete impressions
    const impressions = await ctx.db
      .query("adImpressions")
      .withIndex("by_ad", (q: any) => q.eq("adId", args.adId))
      .collect()
    for (const imp of impressions) {
      await ctx.db.delete(imp._id)
    }

    // Cascade: delete clicks
    const clicks = await ctx.db
      .query("adClicks")
      .withIndex("by_ad", (q: any) => q.eq("adId", args.adId))
      .collect()
    for (const click of clicks) {
      await ctx.db.delete(click._id)
    }

    await ctx.db.delete(args.adId)
    return { success: true }
  },
})

export const recordImpression = mutation({
  args: { adId: v.id("ads") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const ad = await ctx.db.get(args.adId)
    if (!ad) return

    // Frequency cap: once per user per ad per day
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const existing = await ctx.db
      .query("adImpressions")
      .withIndex("by_user_ad", (q: any) =>
        q.eq("userId", user._id).eq("adId", args.adId)
      )
      .filter((q: any) => q.gte(q.field("viewedAt"), startOfDay.getTime()))
      .first()

    if (!existing) {
      await ctx.db.insert("adImpressions", {
        adId: args.adId,
        userId: user._id,
        viewedAt: Date.now(),
      })
      await ctx.db.patch(args.adId, { impressions: (ad.impressions ?? 0) + 1 })
    }
  },
})

export const recordClick = mutation({
  args: { adId: v.id("ads") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const ad = await ctx.db.get(args.adId)
    if (!ad) return

    // Deduplication: max 1 click per user per ad per day
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const existing = await ctx.db
      .query("adClicks")
      .withIndex("by_ad", (q: any) => q.eq("adId", args.adId))
      .filter((q: any) =>
        q.and(
          q.eq(q.field("userId"), user._id),
          q.gte(q.field("clickedAt"), startOfDay.getTime())
        )
      )
      .first()

    if (!existing) {
      await ctx.db.insert("adClicks", {
        adId: args.adId,
        userId: user._id,
        clickedAt: Date.now(),
      })
      await ctx.db.patch(args.adId, { clicks: (ad.clicks ?? 0) + 1 })
    }
  },
})

// ──────────────────────────────────────────────
// Queries
// ──────────────────────────────────────────────

export const getAds = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    let currentUser: any = null
    if (identity) {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
        .unique()
    }

    const now = Date.now()
    const limit = Math.min(args.limit ?? 10, 50)

    const allAds = await ctx.db
      .query("ads")
      .withIndex("by_status", (q: any) => q.eq("status", "active"))
      .collect()

    // Filter out expired and apply targeting
    const visible = allAds.filter((ad) => {
      if (ad.expiresAt && ad.expiresAt < now) return false
      if (!currentUser) return true
      return matchesTargeting(ad, currentUser)
    })

    return visible.slice(0, limit)
  },
})

export const getAdAnalytics = query({
  args: {
    adId: v.optional(v.id("ads")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique()
    if (!user) throw new Error("User not found")

    if (args.adId) {
      const ad = await ctx.db.get(args.adId)
      if (!ad) throw new Error("Ad not found")
      if (ad.advertiserId.toString() !== user._id.toString()) throw new Error("Unauthorized")
      return [{
        ...ad,
        ctr: calcCtr(ad.impressions, ad.clicks),
      }]
    }

    // Return analytics for all advertiser's ads
    const ads = await ctx.db
      .query("ads")
      .withIndex("by_advertiser", (q: any) => q.eq("advertiserId", user._id))
      .collect()

    return ads.map((ad) => ({
      ...ad,
      ctr: calcCtr(ad.impressions, ad.clicks),
    }))
  },
})
