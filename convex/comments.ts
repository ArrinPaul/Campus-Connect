import { v } from "convex/values"
import { query, mutation } from "./_generated/server"
import { sanitizeText } from "./sanitize"
import { api } from "./_generated/api"
import { extractMentions } from "./mention-utils"

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

    // Sanitize content to prevent XSS attacks
    const sanitizedContent = sanitizeText(args.content)

    // Create comment
    const commentId = await ctx.db.insert("comments", {
      postId: args.postId,
      authorId: user._id,
      content: sanitizedContent,
      createdAt: Date.now(),
    })

    // Increment post commentCount
    await ctx.db.patch(args.postId, {
      commentCount: post.commentCount + 1,
    })

    // Create notification for post author (if not commenting on own post)
    if (post.authorId !== user._id) {
      await ctx.scheduler.runAfter(0, api.notifications.createNotification, {
        recipientId: post.authorId,
        actorId: user._id,
        type: "comment" as const,
        referenceId: args.postId,
        message: `${user.name} commented on your post`,
      })
    }

    // Extract mentions and notify mentioned users
    const mentions = extractMentions(sanitizedContent)
    for (const username of mentions) {
      // Find the mentioned user
      const mentionedUser = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", username))
        .first()

      // Fallback: try to find by name if username not found
      let resolvedUser = mentionedUser || null
      if (!resolvedUser) {
        const allUsers = await ctx.db.query("users").collect()
        const foundUser = allUsers.find(
          (u) => u.name.toLowerCase() === username.toLowerCase()
        )
        resolvedUser = foundUser || null
      }

      // Schedule notification if user found and not self-mention
      if (resolvedUser && resolvedUser._id !== user._id) {
        await ctx.scheduler.runAfter(0, api.notifications.createNotification, {
          recipientId: resolvedUser._id,
          actorId: user._id,
          type: "mention" as const,
          referenceId: args.postId,
          message: `mentioned you in a comment`,
        })
      }
    }

    // Return the created comment
    const comment = await ctx.db.get(commentId)
    return comment
  },
})

/**
 * Delete a comment
 * Validates user is the comment author (authorization)
 * Decrements post commentCount
 * Validates: Requirements 12.5, 12.6
 */
export const deleteComment = mutation({
  args: {
    commentId: v.id("comments"),
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

    // Get the comment
    const comment = await ctx.db.get(args.commentId)
    if (!comment) {
      throw new Error("Comment not found")
    }

    // Verify user is the comment author (authorization)
    if (comment.authorId !== user._id) {
      throw new Error("Forbidden: You can only delete your own comments")
    }

    // Decrement post commentCount
    const post = await ctx.db.get(comment.postId)
    if (post) {
      await ctx.db.patch(comment.postId, {
        commentCount: Math.max(0, post.commentCount - 1),
      })
    }

    // Delete the comment
    await ctx.db.delete(args.commentId)

    return { success: true }
  },
})
