import { v } from "convex/values"
import { query, mutation } from "./_generated/server"
import { Id } from "./_generated/dataModel"
import { sanitizeText } from "./sanitize"

/**
 * Create a repost (plain repost or quote post with comment)
 * Validates: user is authenticated, post exists, not reposting own post
 * Updates: post shareCount
 * Validates: Requirements 1.6 (Share/Repost)
 */
export const createRepost = mutation({
  args: {
    originalPostId: v.id("posts"),
    quoteContent: v.optional(v.string()), // optional comment for quote posts
  },
  handler: async (ctx, args) => {
    // Require authentication
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!user) {
      throw new Error("User not found")
    }

    // Check if original post exists
    const originalPost = await ctx.db.get(args.originalPostId)
    if (!originalPost) {
      throw new Error("Original post not found")
    }

    // Prevent reposting own posts
    if (originalPost.authorId === user._id) {
      throw new Error("Cannot repost your own post")
    }

    // Check if user has already reposted this post
    const existingRepost = await ctx.db
      .query("reposts")
      .withIndex("by_user_and_post", (q) => 
        q.eq("userId", user._id).eq("originalPostId", args.originalPostId)
      )
      .first()

    if (existingRepost) {
      throw new Error("You have already reposted this post")
    }

    // Validate quote content if provided
    let sanitizedQuoteContent: string | undefined = undefined
    if (args.quoteContent !== undefined) {
      if (args.quoteContent.trim().length === 0) {
        throw new Error("Quote content cannot be empty")
      }
      if (args.quoteContent.length > 500) {
        throw new Error("Quote content must not exceed 500 characters")
      }
      sanitizedQuoteContent = sanitizeText(args.quoteContent)
    }

    // Create repost
    const repostId = await ctx.db.insert("reposts", {
      userId: user._id,
      originalPostId: args.originalPostId,
      quoteContent: sanitizedQuoteContent,
      createdAt: Date.now(),
    })

    // Increment original post's shareCount
    await ctx.db.patch(args.originalPostId, {
      shareCount: originalPost.shareCount + 1,
    })

    return repostId
  },
})

/**
 * Delete a repost
 * Validates: user can only delete their own reposts
 * Updates: post shareCount (decrement)
 * Validates: Requirements 1.6 (Share/Repost)
 */
export const deleteRepost = mutation({
  args: {
    repostId: v.id("reposts"),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!user) {
      throw new Error("User not found")
    }

    // Get the repost
    const repost = await ctx.db.get(args.repostId)
    if (!repost) {
      throw new Error("Repost not found")
    }

    // Verify ownership
    if (repost.userId !== user._id) {
      throw new Error("You can only delete your own reposts")
    }

    // Get original post to decrement shareCount
    const originalPost = await ctx.db.get(repost.originalPostId)

    // Delete the repost
    await ctx.db.delete(args.repostId)

    // Decrement original post's shareCount (if post still exists)
    if (originalPost) {
      await ctx.db.patch(repost.originalPostId, {
        shareCount: Math.max(0, originalPost.shareCount - 1),
      })
    }
  },
})

/**
 * Get all reposts of a specific post
 * Returns reposts with user data
 * Validates: Requirements 1.6 (Share/Repost)
 */
export const getReposts = query({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Get all reposts for this post
    const reposts = await ctx.db
      .query("reposts")
      .withIndex("by_original_post", (q) => q.eq("originalPostId", args.postId))
      .collect()

    // Fetch user data for each repost
    const repostsWithUsers = await Promise.all(
      reposts.map(async (repost) => {
        const user = await ctx.db.get(repost.userId)
        return {
          ...repost,
          user: user || null,
        }
      })
    )

    return repostsWithUsers
  },
})

/**
 * Check if current user has reposted a specific post
 * Returns the repost if exists, null otherwise
 * Validates: Requirements 1.6 (Share/Repost)
 */
export const hasUserReposted = query({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!user) {
      return null
    }

    // Check if user has reposted this post
    const repost = await ctx.db
      .query("reposts")
      .withIndex("by_user_and_post", (q) => 
        q.eq("userId", user._id).eq("originalPostId", args.postId)
      )
      .first()

    return repost || null
  },
})

/**
 * Get all reposts by a specific user
 * Returns reposts with original post data
 * Validates: Requirements 1.6 (Share/Repost)
 */
export const getUserReposts = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const limit = args.limit || 50

    // Get user's reposts
    const reposts = await ctx.db
      .query("reposts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit)

    // Fetch original post data for each repost
    const repostsWithPosts = await Promise.all(
      reposts.map(async (repost) => {
        const originalPost = await ctx.db.get(repost.originalPostId)
        let postAuthor = null
        if (originalPost) {
          postAuthor = await ctx.db.get(originalPost.authorId)
        }
        return {
          ...repost,
          originalPost: originalPost || null,
          originalPostAuthor: postAuthor || null,
        }
      })
    )

    return repostsWithPosts
  },
})
