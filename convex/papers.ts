import { v } from "convex/values"
import { query, mutation } from "./_generated/server"
import { internal } from "./_generated/api"
import { checkRateLimit, RATE_LIMITS } from "./_lib"

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
 * Upload / register a new paper
 */
export const uploadPaper = mutation({
  args: {
    title: v.string(),
    abstract: v.string(),
    authors: v.array(v.string()),
    doi: v.optional(v.string()),
    pdfUrl: v.optional(v.string()),
    tags: v.array(v.string()),
    lookingForCollaborators: v.optional(v.boolean()),
    linkedUserIds: v.optional(v.array(v.id("users"))), // platform users who are co-authors
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)

    // Rate limit: 5 paper uploads per hour
    await checkRateLimit(ctx, user._id, "uploadPaper", RATE_LIMITS.uploadPaper)

    if (!args.title.trim()) throw new Error("Title cannot be empty")
    if (args.title.length > 300) throw new Error("Title must not exceed 300 characters")
    if (args.abstract.length > 5000) throw new Error("Abstract must not exceed 5000 characters")
    if (args.authors.length === 0) throw new Error("At least one author is required")
    if (args.tags.length > 20) throw new Error("Maximum 20 tags allowed")
    if (args.doi && args.doi.length > 100) throw new Error("DOI must not exceed 100 characters")

    const normalizedTags = args.tags.map((t) => t.trim().toLowerCase()).filter(Boolean)

    const paperId = await ctx.db.insert("papers", {
      title: args.title.trim(),
      abstract: args.abstract.trim(),
      authors: args.authors,
      doi: args.doi?.trim() || undefined,
      pdfUrl: args.pdfUrl || undefined,
      uploadedBy: user._id,
      tags: normalizedTags,
      citationCount: 0,
      lookingForCollaborators: args.lookingForCollaborators ?? false,
      createdAt: Date.now(),
    })

    // Link the uploader as an author
    await ctx.db.insert("paperAuthors", { paperId, userId: user._id })

    // Link additional platform users as co-authors
    if (args.linkedUserIds) {
      if (args.linkedUserIds.length > 20) throw new Error("Maximum 20 co-authors allowed")
      for (const uid of args.linkedUserIds) {
        if (uid !== user._id) {
          await ctx.db.insert("paperAuthors", { paperId, userId: uid })
        }
      }
    }

    // Award reputation for uploading a paper
    await ctx.scheduler.runAfter(0, internal.gamification.awardReputation, {
      userId: user._id,
      action: "paper_uploaded",
    })
    await ctx.scheduler.runAfter(0, internal.gamification.checkAchievements, {
      userId: user._id,
    })

    return paperId
  },
})

/**
 * Update paper metadata (uploader only)
 */
export const updatePaper = mutation({
  args: {
    paperId: v.id("papers"),
    title: v.optional(v.string()),
    abstract: v.optional(v.string()),
    authors: v.optional(v.array(v.string())),
    doi: v.optional(v.string()),
    pdfUrl: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    lookingForCollaborators: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const paper = await ctx.db.get(args.paperId)
    if (!paper) throw new Error("Paper not found")
    if (paper.uploadedBy !== user._id) throw new Error("Only the uploader can edit this paper")

    const updates: any = {}
    if (args.title !== undefined) {
      if (!args.title.trim()) throw new Error("Title cannot be empty")
      if (args.title.length > 300) throw new Error("Title must not exceed 300 characters")
      updates.title = args.title.trim()
    }
    if (args.abstract !== undefined) {
      if (args.abstract.length > 5000) throw new Error("Abstract must not exceed 5000 characters")
      updates.abstract = args.abstract.trim()
    }
    if (args.authors !== undefined) {
      if (args.authors.length === 0) throw new Error("At least one author is required")
      updates.authors = args.authors
    }
    if (args.doi !== undefined) updates.doi = args.doi.trim() || undefined
    if (args.pdfUrl !== undefined) updates.pdfUrl = args.pdfUrl || undefined
    if (args.tags !== undefined) {
      if (args.tags.length > 20) throw new Error("Maximum 20 tags allowed")
      updates.tags = args.tags.map((t) => t.trim().toLowerCase()).filter(Boolean)
    }
    if (args.lookingForCollaborators !== undefined) {
      updates.lookingForCollaborators = args.lookingForCollaborators
    }

    await ctx.db.patch(args.paperId, updates)
  },
})

/**
 * Delete a paper (uploader only) — cascades to paperAuthors
 */
export const deletePaper = mutation({
  args: { paperId: v.id("papers") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx)
    const paper = await ctx.db.get(args.paperId)
    if (!paper) throw new Error("Paper not found")
    if (paper.uploadedBy !== user._id) throw new Error("Only the uploader can delete this paper")

    // Delete paperAuthors links
    const links = await ctx.db
      .query("paperAuthors")
      .withIndex("by_paper", (q: any) => q.eq("paperId", args.paperId))
      .collect()
    for (const link of links) {
      await ctx.db.delete(link._id)
    }

    await ctx.db.delete(args.paperId)
  },
})

// ──────────────────────────────────────────────
// Queries
// ──────────────────────────────────────────────

/**
 * Get a single paper by ID with uploader info and linked authors
 */
export const getPaper = query({
  args: { paperId: v.id("papers") },
  handler: async (ctx, args) => {
    const paper = await ctx.db.get(args.paperId)
    if (!paper) return null

    const uploader = await ctx.db.get(paper.uploadedBy)

    // Get linked platform authors
    const authorLinks = await ctx.db
      .query("paperAuthors")
      .withIndex("by_paper", (q: any) => q.eq("paperId", args.paperId))
      .collect()
    const linkedAuthors = await Promise.all(
      authorLinks.map(async (link: any) => {
        const u = await ctx.db.get(link.userId) as any
        return u ? { _id: u._id, name: u.name, profilePicture: u.profilePicture, username: u.username } : null
      })
    )

    return {
      ...paper,
      uploader: uploader
        ? { _id: uploader._id, name: uploader.name, profilePicture: uploader.profilePicture }
        : null,
      linkedAuthors: linkedAuthors.filter(Boolean),
    }
  },
})

/**
 * Search papers by title, authors, or tags
 */
export const searchPapers = query({
  args: {
    query: v.optional(v.string()),
    tag: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100)
    const allPapers = await ctx.db.query("papers").order("desc").collect()

    let filtered = allPapers
    const q = args.query?.toLowerCase().trim()
    if (q) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.authors.some((a: string) => a.toLowerCase().includes(q)) ||
          p.abstract.toLowerCase().includes(q) ||
          p.tags.some((t: string) => t.includes(q))
      )
    }
    if (args.tag) {
      const tag = args.tag.toLowerCase().trim()
      filtered = filtered.filter((p) => p.tags.includes(tag))
    }

    const results = filtered.slice(0, limit)

    // Enrich with uploader info
    return Promise.all(
      results.map(async (paper) => {
        const uploader = await ctx.db.get(paper.uploadedBy)
        return {
          ...paper,
          uploader: uploader
            ? { _id: uploader._id, name: uploader.name, profilePicture: uploader.profilePicture }
            : null,
        }
      })
    )
  },
})

/**
 * Get papers uploaded by a specific user
 */
export const getUserPapers = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Papers uploaded by user
    const uploaded = await ctx.db
      .query("papers")
      .withIndex("by_uploaded_by", (q: any) => q.eq("uploadedBy", args.userId))
      .order("desc")
      .collect()

    // Papers where user is a linked co-author
    const linkedRefs = await ctx.db
      .query("paperAuthors")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .collect()

    const linkedPaperIds = linkedRefs.map((r: any) => r.paperId)
    const linkedPapers = await Promise.all(
      linkedPaperIds.map(async (id: any) => {
        const p = await ctx.db.get(id)
        return p
      })
    )

    // Merge & deduplicate
    const seen = new Set<string>()
    const all: any[] = []
    for (const p of [...uploaded, ...linkedPapers.filter(Boolean)]) {
      const id = (p as any)._id.toString()
      if (!seen.has(id)) {
        seen.add(id)
        all.push(p)
      }
    }

    // Sort by createdAt desc
    all.sort((a, b) => b.createdAt - a.createdAt)
    return all
  },
})

/**
 * Get papers looking for collaborators, filtered by research interests
 */
export const getCollaborationOpportunities = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100)
    const allPapers = await ctx.db.query("papers").order("desc").collect()

    const collabPapers = allPapers
      .filter((p) => p.lookingForCollaborators === true)
      .slice(0, limit)

    return Promise.all(
      collabPapers.map(async (paper) => {
        const uploader = await ctx.db.get(paper.uploadedBy)
        return {
          ...paper,
          uploader: uploader
            ? { _id: uploader._id, name: uploader.name, profilePicture: uploader.profilePicture }
            : null,
        }
      })
    )
  },
})
