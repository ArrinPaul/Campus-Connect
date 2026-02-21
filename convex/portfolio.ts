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
// Projects — CRUD
// ──────────────────────────────────────────────

export const addProject = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    techStack: v.array(v.string()),
    links: v.array(v.string()),
    screenshots: v.optional(v.array(v.string())),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)

    if (!args.title.trim()) throw new Error("Project title cannot be empty")
    if (args.title.length > 200) throw new Error("Title must not exceed 200 characters")
    if (args.description.length > 3000) throw new Error("Description must not exceed 3000 characters")
    if (args.techStack.length > 20) throw new Error("Maximum 20 technologies allowed")
    if (args.links.length > 10) throw new Error("Maximum 10 links allowed")
    if (args.screenshots && args.screenshots.length > 10) throw new Error("Maximum 10 screenshots allowed")
    if (args.endDate && args.startDate && args.endDate < args.startDate) {
      throw new Error("End date must be after start date")
    }

    return ctx.db.insert("projects", {
      userId: user._id,
      title: args.title.trim(),
      description: args.description.trim(),
      techStack: args.techStack.map((t) => t.trim()).filter(Boolean),
      links: args.links.filter(Boolean),
      screenshots: args.screenshots ?? [],
      startDate: args.startDate,
      endDate: args.endDate,
      createdAt: Date.now(),
    })
  },
})

export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    techStack: v.optional(v.array(v.string())),
    links: v.optional(v.array(v.string())),
    screenshots: v.optional(v.array(v.string())),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const project = await ctx.db.get(args.projectId)
    if (!project) throw new Error("Project not found")
    if (project.userId !== user._id) throw new Error("Not your project")

    const updates: any = {}
    if (args.title !== undefined) {
      if (!args.title.trim()) throw new Error("Project title cannot be empty")
      if (args.title.length > 200) throw new Error("Title must not exceed 200 characters")
      updates.title = args.title.trim()
    }
    if (args.description !== undefined) {
      if (args.description.length > 3000) throw new Error("Description must not exceed 3000 characters")
      updates.description = args.description.trim()
    }
    if (args.techStack !== undefined) {
      if (args.techStack.length > 20) throw new Error("Maximum 20 technologies allowed")
      updates.techStack = args.techStack.map((t) => t.trim()).filter(Boolean)
    }
    if (args.links !== undefined) {
      if (args.links.length > 10) throw new Error("Maximum 10 links allowed")
      updates.links = args.links.filter(Boolean)
    }
    if (args.screenshots !== undefined) {
      if (args.screenshots.length > 10) throw new Error("Maximum 10 screenshots allowed")
      updates.screenshots = args.screenshots
    }
    if (args.startDate !== undefined) updates.startDate = args.startDate
    if (args.endDate !== undefined) updates.endDate = args.endDate

    await ctx.db.patch(args.projectId, updates)
  },
})

export const deleteProject = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const project = await ctx.db.get(args.projectId)
    if (!project) throw new Error("Project not found")
    if (project.userId !== user._id) throw new Error("Not your project")
    await ctx.db.delete(args.projectId)
  },
})

export const getProjects = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("projects")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .order("desc")
      .collect()
  },
})

// ──────────────────────────────────────────────
// Timeline — CRUD
// ──────────────────────────────────────────────

export const addTimelineItem = mutation({
  args: {
    type: v.union(
      v.literal("course"),
      v.literal("certification"),
      v.literal("publication"),
      v.literal("award")
    ),
    title: v.string(),
    institution: v.optional(v.string()),
    date: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)

    if (!args.title.trim()) throw new Error("Title cannot be empty")
    if (args.title.length > 200) throw new Error("Title must not exceed 200 characters")
    if (args.institution && args.institution.length > 200) {
      throw new Error("Institution must not exceed 200 characters")
    }

    return ctx.db.insert("timeline", {
      userId: user._id,
      type: args.type,
      title: args.title.trim(),
      institution: args.institution?.trim() || undefined,
      date: args.date,
      createdAt: Date.now(),
    })
  },
})

export const deleteTimelineItem = mutation({
  args: { itemId: v.id("timeline") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const item = await ctx.db.get(args.itemId)
    if (!item) throw new Error("Timeline item not found")
    if (item.userId !== user._id) throw new Error("Not your timeline item")
    await ctx.db.delete(args.itemId)
  },
})

export const getTimeline = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("timeline")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .collect()
    // Sort by date descending
    return items.sort((a, b) => b.date - a.date)
  },
})

// ──────────────────────────────────────────────
// Contribution Heatmap data
// ──────────────────────────────────────────────

/**
 * Returns daily activity counts for a user over the last year (365 days).
 * Activity = posts + comments created per day.
 */
export const getContributionData = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now()
    const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000

    // Get user posts in last year
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q: any) => q.eq("authorId", args.userId))
      .collect()
    const recentPosts = posts.filter((p) => p.createdAt >= oneYearAgo)

    // Get user comments in last year
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_author", (q: any) => q.eq("authorId", args.userId))
      .collect()
    const recentComments = comments.filter((c) => c.createdAt >= oneYearAgo)

    // Group by day
    const dayMap: Record<string, number> = {}
    const toDay = (ts: number) => new Date(ts).toISOString().slice(0, 10)

    for (const p of recentPosts) {
      const key = toDay(p.createdAt)
      dayMap[key] = (dayMap[key] || 0) + 1
    }
    for (const c of recentComments) {
      const key = toDay(c.createdAt)
      dayMap[key] = (dayMap[key] || 0) + 1
    }

    return dayMap
  },
})
