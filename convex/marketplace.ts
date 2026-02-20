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
// Constants & validation helpers
// ──────────────────────────────────────────────
export const CATEGORIES = ["books", "electronics", "furniture", "services", "other"] as const
export const CONDITIONS = ["new", "like_new", "good", "fair", "poor"] as const
export const LISTING_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

export type Category = (typeof CATEGORIES)[number]
export type Condition = (typeof CONDITIONS)[number]

export function validateListingTitle(title: string): void {
  if (!title.trim()) throw new Error("Title is required")
  if (title.length > 150) throw new Error("Title must be 150 characters or fewer")
}

export function validateListingDescription(desc: string): void {
  if (!desc.trim()) throw new Error("Description is required")
  if (desc.length > 3000) throw new Error("Description must be 3000 characters or fewer")
}

export function validatePrice(price: number): void {
  if (!Number.isFinite(price)) throw new Error("Price must be a valid number")
  if (price < 0) throw new Error("Price cannot be negative")
}

export function validateCategory(category: string): void {
  if (!(CATEGORIES as readonly string[]).includes(category)) {
    throw new Error(`Category must be one of: ${CATEGORIES.join(", ")}`)
  }
}

export function validateCondition(condition: string): void {
  if (!(CONDITIONS as readonly string[]).includes(condition)) {
    throw new Error(`Condition must be one of: ${CONDITIONS.join(", ")}`)
  }
}

export function isListingActive(
  status: string,
  expiresAt: number | undefined,
  now: number
): boolean {
  if (status !== "active") return false
  if (expiresAt && expiresAt < now) return false
  return true
}

export function matchesPriceRange(
  price: number,
  minPrice: number | undefined,
  maxPrice: number | undefined
): boolean {
  if (minPrice !== undefined && price < minPrice) return false
  if (maxPrice !== undefined && price > maxPrice) return false
  return true
}

// ──────────────────────────────────────────────
// Mutations
// ──────────────────────────────────────────────

export const createListing = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.union(...CATEGORIES.map((c) => v.literal(c))),
    price: v.number(),
    condition: v.union(...CONDITIONS.map((c) => v.literal(c))),
    images: v.optional(v.array(v.string())),
    university: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    validateListingTitle(args.title)
    validateListingDescription(args.description)
    validatePrice(args.price)

    const now = Date.now()
    const id = await ctx.db.insert("listings", {
      title: args.title,
      description: args.description,
      category: args.category,
      price: args.price,
      condition: args.condition,
      images: args.images,
      sellerId: user._id,
      university: args.university ?? user.university,
      status: "active",
      expiresAt: now + LISTING_EXPIRY_MS,
      createdAt: now,
    })
    return id
  },
})

export const updateListing = mutation({
  args: {
    listingId: v.id("listings"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    condition: v.optional(v.union(...CONDITIONS.map((c) => v.literal(c)))),
    images: v.optional(v.array(v.string())),
    status: v.optional(v.union(v.literal("active"), v.literal("sold"), v.literal("expired"))),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const listing = await ctx.db.get(args.listingId)
    if (!listing) throw new Error("Listing not found")
    if (listing.sellerId.toString() !== user._id.toString()) throw new Error("Unauthorized")

    if (args.title !== undefined) validateListingTitle(args.title)
    if (args.description !== undefined) validateListingDescription(args.description)
    if (args.price !== undefined) validatePrice(args.price)

    const { listingId, ...updates } = args
    await ctx.db.patch(listingId, updates)
    return { success: true }
  },
})

export const deleteListing = mutation({
  args: { listingId: v.id("listings") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const listing = await ctx.db.get(args.listingId)
    if (!listing) throw new Error("Listing not found")
    if (listing.sellerId.toString() !== user._id.toString()) throw new Error("Unauthorized")
    await ctx.db.delete(args.listingId)
    return { success: true }
  },
})

export const markAsSold = mutation({
  args: { listingId: v.id("listings") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const listing = await ctx.db.get(args.listingId)
    if (!listing) throw new Error("Listing not found")
    if (listing.sellerId.toString() !== user._id.toString()) throw new Error("Unauthorized")
    await ctx.db.patch(args.listingId, { status: "sold" })
    return { success: true }
  },
})

// ──────────────────────────────────────────────
// Queries
// ──────────────────────────────────────────────

export const getListings = query({
  args: {
    category: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    university: v.optional(v.string()),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50)
    const now = Date.now()

    let listings
    if (args.category) {
      listings = await ctx.db
        .query("listings")
        .withIndex("by_category", (q: any) => q.eq("category", args.category))
        .order("desc")
        .collect()
    } else {
      listings = await ctx.db
        .query("listings")
        .withIndex("by_status", (q: any) => q.eq("status", "active"))
        .order("desc")
        .collect()
    }

    // Apply filters
    const filtered = listings.filter((l) => {
      if (!isListingActive(l.status, l.expiresAt, now)) return false
      if (!matchesPriceRange(l.price, args.minPrice, args.maxPrice)) return false
      if (args.university && l.university && l.university !== args.university) return false
      return true
    })

    return filtered.slice(0, limit)
  },
})

export const getListing = query({
  args: { listingId: v.id("listings") },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.listingId)
    if (!listing) return null
    const seller = await ctx.db.get(listing.sellerId)
    return {
      ...listing,
      seller: seller
        ? { name: seller.name, username: seller.username, avatarUrl: seller.avatarUrl }
        : null,
    }
  },
})

export const getMyListings = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .unique()
    if (!user) return []

    return ctx.db
      .query("listings")
      .withIndex("by_seller", (q: any) => q.eq("sellerId", user._id))
      .order("desc")
      .collect()
  },
})
