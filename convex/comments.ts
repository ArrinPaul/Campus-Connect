import { v } from "convex/values"
import { query, mutation } from "./_generated/server"
import { sanitizeText, sanitizeMarkdown } from "./sanitize"
import { api } from "./_generated/api"
import { extractMentions } from "./mentionUtils"

/**
 * Get all comments for a post (flat list ordered oldest first, includes depth for client-side tree rendering)
 * Validates: Requirements 5.9, 12.4
 */
export const getPostComments = query({
  args: {
    postId: v.id("posts"),
    sortBy: v.optional(v.union(v.literal("new"), v.literal("old"), v.literal("best"), v.literal("controversial"))),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Get all comments for the post
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect()

    // Fetch author data for each comment
    const commentsWithAuthors = await Promise.all(
      comments.map(async (comment) => {
        const author = await ctx.db.get(comment.authorId)
        return {
          ...comment,
          depth: comment.depth ?? 0,
          replyCount: comment.replyCount ?? 0,
          author: author || null,
        }
      })
    )

    // Separate top-level (depth=0) and replies
    const topLevel = commentsWithAuthors.filter((c) => !c.parentCommentId)
    const replies = commentsWithAuthors.filter((c) => !!c.parentCommentId)

    // Sort top-level comments by the requested sort order
    const sortBy = args.sortBy ?? "old"
    if (sortBy === "new") {
      topLevel.sort((a, b) => b.createdAt - a.createdAt)
    } else if (sortBy === "old") {
      topLevel.sort((a, b) => a.createdAt - b.createdAt)
    } else if (sortBy === "best") {
      topLevel.sort((a, b) => {
        const scoreA = (a.reactionCounts?.like ?? 0) + (a.replyCount ?? 0)
        const scoreB = (b.reactionCounts?.like ?? 0) + (b.replyCount ?? 0)
        return scoreB - scoreA
      })
    } else if (sortBy === "controversial") {
      topLevel.sort((a, b) => {
        const scoreA = (a.replyCount ?? 0) - (a.reactionCounts?.like ?? 0)
        const scoreB = (b.replyCount ?? 0) - (b.reactionCounts?.like ?? 0)
        return scoreB - scoreA
      })
    }

    // Replies stay sorted oldest-first within their parent branch
    replies.sort((a, b) => a.createdAt - b.createdAt)

    // Return flat list: top-level first, replies maintain their parentCommentId association
    return [...topLevel, ...replies]
  },
})

/**
 * Get direct replies to a comment, paginated
 */
export const getCommentReplies = query({
  args: {
    parentCommentId: v.id("comments"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const replies = await ctx.db
      .query("comments")
      .withIndex("by_parent", (q) => q.eq("parentCommentId", args.parentCommentId))
      .collect()

    replies.sort((a, b) => a.createdAt - b.createdAt)

    const repliesWithAuthors = await Promise.all(
      replies.map(async (reply) => {
        const author = await ctx.db.get(reply.authorId)
        return {
          ...reply,
          depth: reply.depth ?? 1,
          replyCount: reply.replyCount ?? 0,
          author: author || null,
        }
      })
    )

    return repliesWithAuthors
  },
})

/**
 * Create a new comment on a post, or reply to an existing comment
 * Validates comment content (non-empty, max 1000 chars)
 * Increments post commentCount and parent replyCount for replies
 * Max nesting depth = 5
 * Validates: Requirements 5.5, 5.6, 5.7, 12.4
 */
export const createComment = mutation({
  args: {
    postId: v.id("posts"),
    content: v.string(),
    parentCommentId: v.optional(v.id("comments")),
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
    const sanitizedContent = sanitizeMarkdown(args.content)

    // Resolve parent comment depth
    let depth = 0
    if (args.parentCommentId) {
      const parentComment = await ctx.db.get(args.parentCommentId)
      if (!parentComment) {
        throw new Error("Parent comment not found")
      }
      if (parentComment.postId !== args.postId) {
        throw new Error("Parent comment does not belong to this post")
      }
      const parentDepth = parentComment.depth ?? 0
      depth = Math.min(parentDepth + 1, 5)
    }

    // Create comment
    const commentId = await ctx.db.insert("comments", {
      postId: args.postId,
      authorId: user._id,
      content: sanitizedContent,
      parentCommentId: args.parentCommentId,
      depth,
      replyCount: 0,
      createdAt: Date.now(),
    })

    // Increment parent's replyCount
    if (args.parentCommentId) {
      const parentComment = await ctx.db.get(args.parentCommentId)
      if (parentComment) {
        await ctx.db.patch(args.parentCommentId, {
          replyCount: (parentComment.replyCount ?? 0) + 1,
        })
      }
    }

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
 * Delete a comment and cascade-delete all its nested replies
 * Validates user is the comment author (authorization)
 * Decrements post commentCount for each deleted comment
 * Decrements parent's replyCount when deleting a reply
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

    // Collect all descendant comment IDs (BFS)
    const toDelete: typeof args.commentId[] = [args.commentId]
    const queue: typeof args.commentId[] = [args.commentId]
    while (queue.length > 0) {
      const parentId = queue.shift()!
      const children = await ctx.db
        .query("comments")
        .withIndex("by_parent", (q) => q.eq("parentCommentId", parentId))
        .collect()
      for (const child of children) {
        toDelete.push(child._id)
        queue.push(child._id)
      }
    }

    // Decrement post commentCount by total deleted count
    const post = await ctx.db.get(comment.postId)
    if (post) {
      await ctx.db.patch(comment.postId, {
        commentCount: Math.max(0, post.commentCount - toDelete.length),
      })
    }

    // Decrement parent's replyCount if this is a reply
    if (comment.parentCommentId) {
      const parentComment = await ctx.db.get(comment.parentCommentId)
      if (parentComment) {
        await ctx.db.patch(comment.parentCommentId, {
          replyCount: Math.max(0, (parentComment.replyCount ?? 0) - 1),
        })
      }
    }

    // Delete all collected comments
    for (const id of toDelete) {
      await ctx.db.delete(id)
    }

    return { success: true }
  },
})
