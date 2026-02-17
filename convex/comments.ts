import { v } from "convex/values"
import { query, mutation } from "./_generated/server"

/**
 * Get all comments for a post
 * Returns comments ordered by createdAt ascending (oldest first)
 * Includes author data in responses
 * Validates: Requirements 5.9, 12.4
 */
export const getPostComments = query({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Get all comments for the post ordered by createdAt ascending (oldest first)
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect()

    // Sort by createdAt ascending (oldest first)
    const sortedComments = comments.sort((a, b) => a.createdAt - b.createdAt)

    // Fetch author data for each comment
    const commentsWithAuthors = await Promise.all(
      sortedComments.map(async (comment) => {
        const author = await ctx.db.get(comment.authorId)
        return {
          ...comment,
          author: author || null,
        }
      })
    )

    return commentsWithAuthors
  },
})

/**
 * Create a new comment on a post
 * Validates comment content (non-empty, max 1000 chars)
 * Increments post commentCount
 * Validates: Requirements 5.5, 5.6, 5.7, 12.4
 */
export const createComment = mutation({
  args: {
    postId: v.id("posts"),
    content: v.string(),
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

    // Check if post exists
    const post = await ctx.db.get(args.postId)
    if (!post) {
      throw new Error("Post not found")
    }

    // Validate content - non-empty
    if (!args.content || args.content.trim().length === 0) {
      throw new Error("Comment content cannot be empty")
    }

    // Validate content - max 1000 characters
    if (args.content.length > 1000) {
      throw new Error("Comment content must not exceed 1000 characters")
    }

    // Create comment
    const commentId = await ctx.db.insert("comments", {
      postId: args.postId,
      authorId: user._id,
      content: args.content,
      createdAt: Date.now(),
    })

    // Increment post commentCount
    await ctx.db.patch(args.postId, {
      commentCount: post.commentCount + 1,
    })

    // Return the created comment
    const comment = await ctx.db.get(commentId)
    return comment
  },
})
