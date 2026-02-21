import { v } from "convex/values"
import { query, mutation } from "./_generated/server"
import { internal } from "./_generated/api"

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
// Mutations
// ──────────────────────────────────────────────

/**
 * Upload a study resource
 */
export const uploadResource = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    fileUrl: v.optional(v.string()),
    course: v.string(),
    subject: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)

    if (!args.title.trim()) throw new Error("Title cannot be empty")
    if (args.title.length > 200) throw new Error("Title must not exceed 200 characters")
    if (args.description.length > 3000) throw new Error("Description must not exceed 3000 characters")
    if (!args.course.trim()) throw new Error("Course cannot be empty")
    if (args.course.length > 100) throw new Error("Course must not exceed 100 characters")
    if (args.subject && args.subject.length > 100) {
      throw new Error("Subject must not exceed 100 characters")
    }

    const resourceId = await ctx.db.insert("resources", {
      title: args.title.trim(),
      description: args.description.trim(),
      fileUrl: args.fileUrl || undefined,
      course: args.course.trim(),
      subject: args.subject?.trim() || undefined,
      uploadedBy: user._id,
      rating: 0,
      ratingCount: 0,
      downloadCount: 0,
      createdAt: Date.now(),
    })

    // Award reputation for uploading a resource
    await ctx.scheduler.runAfter(0, internal.gamification.awardReputation, {
      userId: user._id,
      action: "resource_uploaded",
    })
    await ctx.scheduler.runAfter(0, internal.gamification.checkAchievements, {
      userId: user._id,
    })

    return resourceId
  },
})

/**
 * Delete a resource (uploader only)
 */
export const deleteResource = mutation({
  args: { resourceId: v.id("resources") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const resource = await ctx.db.get(args.resourceId)
    if (!resource) throw new Error("Resource not found")
    if (resource.uploadedBy !== user._id) throw new Error("Only the uploader can delete")
    await ctx.db.delete(args.resourceId)
  },
})

/**
 * Rate a resource (1-5 stars)
 */
export const rateResource = mutation({
  args: {
    resourceId: v.id("resources"),
    rating: v.number(),
  },
  handler: async (ctx, args) => {
    await getAuthUser(ctx)
    const resource = await ctx.db.get(args.resourceId)
    if (!resource) throw new Error("Resource not found")

    if (args.rating < 1 || args.rating > 5) throw new Error("Rating must be between 1 and 5")
    if (!Number.isInteger(args.rating)) throw new Error("Rating must be a whole number")

    // Simple moving average (in production, track per-user ratings to prevent duplicates)
    const newCount = resource.ratingCount + 1
    const newRating = ((resource.rating * resource.ratingCount) + args.rating) / newCount

    await ctx.db.patch(args.resourceId, {
      rating: Math.round(newRating * 100) / 100,
      ratingCount: newCount,
    })
  },
})

/**
 * Increment download count
 */
export const downloadResource = mutation({
  args: { resourceId: v.id("resources") },
  handler: async (ctx, args) => {
    // Require auth to prevent unauthenticated download count inflation
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    const resource = await ctx.db.get(args.resourceId)
    if (!resource) throw new Error("Resource not found")
    await ctx.db.patch(args.resourceId, {
      downloadCount: resource.downloadCount + 1,
    })
  },
})

// ──────────────────────────────────────────────
// Queries
// ──────────────────────────────────────────────

/**
 * Get resources filtered by course / search
 */
export const getResources = query({
  args: {
    course: v.optional(v.string()),
    query: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100)

    let resources
    if (args.course) {
      resources = await ctx.db
        .query("resources")
        .withIndex("by_course", (q: any) => q.eq("course", args.course))
        .collect()
    } else {
      resources = await ctx.db.query("resources").collect()
    }

    // Text search
    const q = args.query?.toLowerCase().trim()
    if (q) {
      resources = resources.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.course.toLowerCase().includes(q) ||
          (r.subject && r.subject.toLowerCase().includes(q))
      )
    }

    // Sort by rating then recency
    resources.sort((a, b) => b.rating - a.rating || b.createdAt - a.createdAt)

    const results = resources.slice(0, limit)

    return Promise.all(
      results.map(async (r) => {
        const uploader = await ctx.db.get(r.uploadedBy)
        return {
          ...r,
          uploader: uploader
            ? { _id: uploader._id, name: uploader.name, profilePicture: uploader.profilePicture }
            : null,
        }
      })
    )
  },
})

/**
 * Get a single resource by ID
 */
export const getResource = query({
  args: { resourceId: v.id("resources") },
  handler: async (ctx, args) => {
    const resource = await ctx.db.get(args.resourceId)
    if (!resource) return null
    const uploader = await ctx.db.get(resource.uploadedBy)
    return {
      ...resource,
      uploader: uploader
        ? { _id: uploader._id, name: uploader.name, profilePicture: uploader.profilePicture }
        : null,
    }
  },
})
