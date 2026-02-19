import { v } from "convex/values"
import { query, mutation, internalMutation } from "./_generated/server"
import { Id } from "./_generated/dataModel"

/** 24 hours in milliseconds */
const STORY_TTL_MS = 24 * 60 * 60 * 1000

// ─── createStory ─────────────────────────────────────────────────────────────

/**
 * Create a new story. Requires at least one of: content or mediaUrl.
 * The story automatically expires 24 hours after creation.
 */
export const createStory = mutation({
  args: {
    content: v.optional(v.string()),
    mediaUrl: v.optional(v.string()),
    backgroundColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    if (!args.content && !args.mediaUrl) {
      throw new Error("Story must have either content or media")
    }

    if (args.content && args.content.trim().length === 0) {
      throw new Error("Story content cannot be empty")
    }

    if (args.content && args.content.length > 500) {
      throw new Error("Story text must not exceed 500 characters")
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()
    if (!user) throw new Error("User not found")

    const now = Date.now()
    const storyId = await ctx.db.insert("stories", {
      authorId: user._id,
      content: args.content,
      mediaUrl: args.mediaUrl,
      backgroundColor: args.backgroundColor,
      expiresAt: now + STORY_TTL_MS,
      viewCount: 0,
      createdAt: now,
    })

    return storyId
  },
})

// ─── getStories ───────────────────────────────────────────────────────────────

/**
 * Get all active (non-expired) stories from followed users + own stories.
 * Returns stories annotated with `viewed` (by current user) and `author` info.
 * Stories are grouped and sorted by author (own stories first), then by createdAt.
 */
export const getStories = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()
    if (!user) return []

    // Collect IDs of users to show stories for (self + followed)
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", user._id))
      .collect()
    const followedIds = new Set(follows.map((f) => f.followingId as string))
    followedIds.add(user._id as string)

    const now = Date.now()

    // All non-expired stories
    const activeStories = await ctx.db
      .query("stories")
      .withIndex("by_expiry", (q) => q.gt("expiresAt", now))
      .collect()

    // Filter to relevant authors only
    const relevantStories = activeStories.filter((s) =>
      followedIds.has(s.authorId as string)
    )

    if (relevantStories.length === 0) return []

    // Batch-check which stories current user has viewed
    const viewChecks = await Promise.all(
      relevantStories.map((s) =>
        ctx.db
          .query("storyViews")
          .withIndex("by_story_viewer", (q) =>
            q.eq("storyId", s._id).eq("viewerId", user._id)
          )
          .unique()
      )
    )

    // Get unique author IDs and batch-fetch user docs
    const authorIdSet = new Set(relevantStories.map((s) => s.authorId as string))
    const authorIds = Array.from(authorIdSet) as Id<"users">[]
    const authorDocs = await Promise.all(authorIds.map((id) => ctx.db.get(id)))
    const authorMap = new Map(
      authorDocs
        .filter(Boolean)
        .map((a) => [a!._id as string, a!])
    )

    const annotated = relevantStories.map((story, i) => ({
      ...story,
      viewed: !!viewChecks[i],
      author: authorMap.get(story.authorId as string) ?? null,
    }))

    // Sort: own stories first, then by createdAt desc
    annotated.sort((a, b) => {
      if ((a.authorId as string) === (user._id as string)) return -1
      if ((b.authorId as string) === (user._id as string)) return 1
      return b.createdAt - a.createdAt
    })

    return annotated
  },
})

// ─── getStoryById ─────────────────────────────────────────────────────────────

/**
 * Get a single story by ID, including author info.
 * Returns null if expired or not found.
 */
export const getStoryById = query({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const story = await ctx.db.get(args.storyId)
    if (!story) return null

    const now = Date.now()
    if (story.expiresAt <= now) return null

    const author = await ctx.db.get(story.authorId)
    return { ...story, author }
  },
})

// ─── viewStory ────────────────────────────────────────────────────────────────

/**
 * Record that the current user viewed a story.
 * Idempotent — calling multiple times has no additional effect.
 * Increments viewCount only on first view.
 */
export const viewStory = mutation({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()
    if (!user) throw new Error("User not found")

    const story = await ctx.db.get(args.storyId)
    if (!story) throw new Error("Story not found")

    const now = Date.now()
    if (story.expiresAt <= now) throw new Error("Story has expired")

    // Check if already viewed
    const existing = await ctx.db
      .query("storyViews")
      .withIndex("by_story_viewer", (q) =>
        q.eq("storyId", args.storyId).eq("viewerId", user._id)
      )
      .unique()

    if (!existing) {
      // Record view
      await ctx.db.insert("storyViews", {
        storyId: args.storyId,
        viewerId: user._id,
        viewedAt: now,
      })
      // Increment view count
      await ctx.db.patch(story._id, {
        viewCount: story.viewCount + 1,
      })
    }

    return { viewed: true }
  },
})

// ─── getStoryViewers ──────────────────────────────────────────────────────────

/**
 * Get the list of users who viewed a story.
 * Only accessible by the story author.
 */
export const getStoryViewers = query({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()
    if (!user) throw new Error("User not found")

    const story = await ctx.db.get(args.storyId)
    if (!story) throw new Error("Story not found")

    if ((story.authorId as string) !== (user._id as string)) {
      throw new Error("Not authorized — only the story author can see viewers")
    }

    const views = await ctx.db
      .query("storyViews")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .collect()

    const viewers = await Promise.all(
      views.map(async (v) => {
        const viewer = await ctx.db.get(v.viewerId)
        return viewer ? { ...viewer, viewedAt: v.viewedAt } : null
      })
    )

    return viewers.filter(Boolean)
  },
})

// ─── deleteStory ──────────────────────────────────────────────────────────────

/**
 * Delete a story. Only the author may delete their own story.
 * Also removes all associated storyViews records.
 */
export const deleteStory = mutation({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()
    if (!user) throw new Error("User not found")

    const story = await ctx.db.get(args.storyId)
    if (!story) throw new Error("Story not found")

    if ((story.authorId as string) !== (user._id as string)) {
      throw new Error("Not authorized to delete this story")
    }

    // Delete all views
    const views = await ctx.db
      .query("storyViews")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .collect()
    await Promise.all(views.map((v) => ctx.db.delete(v._id)))

    // Delete story
    await ctx.db.delete(args.storyId)

    return { deleted: true }
  },
})

// ─── deleteExpiredStoriesInternal ─────────────────────────────────────────────

/**
 * Internal mutation run by cron job every hour.
 * Deletes all stories whose expiresAt has passed, along with their views.
 */
export const deleteExpiredStoriesInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()

    // Collect all expired stories
    const expired = await ctx.db
      .query("stories")
      .withIndex("by_expiry", (q) => q.lte("expiresAt", now))
      .collect()

    let deletedStories = 0
    let deletedViews = 0

    for (const story of expired) {
      // Delete all views for this story
      const views = await ctx.db
        .query("storyViews")
        .withIndex("by_story", (q) => q.eq("storyId", story._id))
        .collect()
      await Promise.all(views.map((v) => ctx.db.delete(v._id)))
      deletedViews += views.length

      // Delete the story
      await ctx.db.delete(story._id)
      deletedStories++
    }

    return { deletedStories, deletedViews }
  },
})
