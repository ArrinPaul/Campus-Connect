import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { sanitizeMarkdown } from "./sanitize";
import { internal } from "./_generated/api";
import { extractMentions } from "./mentionUtils";
import { COMMENT_MAX_LENGTH } from "./validation_constants";
import { checkRateLimit, RATE_LIMITS, requireOnboarding } from "./_lib";

/**
 * Get all comments for a post (flat list ordered oldest first, includes depth for client-side tree rendering)
 */
export const getPostComments = query({
  args: {
    postId: v.id("posts"),
    sortBy: v.optional(v.union(v.literal("new"), v.literal("old"), v.literal("best"), v.literal("controversial"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 200);
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .take(limit * 3);

    const commentsWithAuthors = await Promise.all(
      comments.map(async (comment) => {
        const author = await ctx.db.get(comment.authorId);
        return {
          ...comment,
          depth: comment.depth ?? 0,
          replyCount: comment.replyCount ?? 0,
          author: author || null,
        };
      })
    );

    const topLevel = commentsWithAuthors.filter((c) => !c.parentCommentId);
    const replies = commentsWithAuthors.filter((c) => !!c.parentCommentId);

    const sortBy = args.sortBy ?? "old";
    if (sortBy === "new") {
      topLevel.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sortBy === "old") {
      topLevel.sort((a, b) => a.createdAt - b.createdAt);
    } else if (sortBy === "best") {
      topLevel.sort((a, b) => {
        const scoreA = (a.reactionCounts?.like ?? 0) + (a.replyCount ?? 0);
        const scoreB = (b.reactionCounts?.like ?? 0) + (b.replyCount ?? 0);
        return scoreB - scoreA;
      });
    }

    replies.sort((a, b) => a.createdAt - b.createdAt);

    return [...topLevel, ...replies];
  },
});

/**
 * Get direct replies to a comment, paginated
 */
export const getCommentReplies = query({
  args: {
    parentCommentId: v.id("comments"),
  },
  handler: async (ctx, args) => {
    const replies = await ctx.db
      .query("comments")
      .withIndex("by_parent", (q) => q.eq("parentCommentId", args.parentCommentId))
      .collect();

    replies.sort((a, b) => a.createdAt - b.createdAt);

    const repliesWithAuthors = await Promise.all(
      replies.map(async (reply) => {
        const author = await ctx.db.get(reply.authorId);
        return {
          ...reply,
          depth: reply.depth ?? 1,
          replyCount: reply.replyCount ?? 0,
          author: author || null,
        };
      })
    );

    return repliesWithAuthors;
  },
});

/**
 * REFACTORED: Create a new comment, requiring onboarding.
 */
export const createComment = mutation({
  args: {
    postId: v.id("posts"),
    content: v.string(),
    parentCommentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, args) => {
    const user = await requireOnboarding(ctx);
    await checkRateLimit(ctx, user._id, "createComment", RATE_LIMITS.createComment);

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    if (!args.content?.trim()) throw new Error("Comment content cannot be empty");
    if (args.content.length > COMMENT_MAX_LENGTH) {
      throw new Error(`Comment content must not exceed ${COMMENT_MAX_LENGTH} characters`);
    }

    const sanitizedContent = sanitizeMarkdown(args.content);

    let depth = 0;
    if (args.parentCommentId) {
      const parentComment = await ctx.db.get(args.parentCommentId);
      if (!parentComment) throw new Error("Parent comment not found");
      if (parentComment.postId !== args.postId) {
        throw new Error("Parent comment does not belong to this post");
      }
      depth = Math.min((parentComment.depth ?? 0) + 1, 5);
    }

    const commentId = await ctx.db.insert("comments", {
      postId: args.postId,
      authorId: user._id,
      content: sanitizedContent,
      parentCommentId: args.parentCommentId,
      depth,
      replyCount: 0,
      createdAt: Date.now(),
    });

    if (args.parentCommentId) {
      await ctx.scheduler.runAfter(0, internal.counters.updateCommentReplyCount, {
        commentId: args.parentCommentId,
        delta: 1,
      });
    }

    await ctx.scheduler.runAfter(0, internal.counters.incrementPostCounts, {
      postId: args.postId,
      commentCount: 1,
    });

    if (post.authorId !== user._id) {
      await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
        recipientId: post.authorId,
        actorId: user._id,
        type: "comment" as const,
        referenceId: args.postId,
        message: `${user.name} commented on your post`,
      });
    }

    const mentions = extractMentions(sanitizedContent);
    for (const username of mentions) {
      const mentionedUser = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", username))
        .first();
      if (mentionedUser && mentionedUser._id !== user._id) {
        await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
          recipientId: mentionedUser._id,
          actorId: user._id,
          type: "mention" as const,
          referenceId: args.postId,
          message: `mentioned you in a comment`,
        });
      }
    }

    return await ctx.db.get(commentId);
  },
});

/**
 * REFACTORED: Delete a comment, requiring onboarding.
 */
export const deleteComment = mutation({
  args: {
    commentId: v.id("comments"),
  },
  handler: async (ctx, args) => {
    const user = await requireOnboarding(ctx);

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");

    if (comment.authorId !== user._id && !user.isAdmin) {
      throw new Error("Forbidden: You can only delete your own comments");
    }

    const toDelete: typeof args.commentId[] = [args.commentId];
    const queue: typeof args.commentId[] = [args.commentId];
    while (queue.length > 0) {
      const parentId = queue.shift()!;
      const children = await ctx.db
        .query("comments")
        .withIndex("by_parent", (q) => q.eq("parentCommentId", parentId))
        .collect();
      for (const child of children) {
        toDelete.push(child._id);
        queue.push(child._id);
      }
    }

    await ctx.scheduler.runAfter(0, internal.counters.decrementPostCounts, {
        postId: comment.postId,
        commentCount: toDelete.length,
    });

    if (comment.parentCommentId) {
        await ctx.scheduler.runAfter(0, internal.counters.updateCommentReplyCount, {
            commentId: comment.parentCommentId,
            delta: -1,
        });
    }

    for (const id of toDelete) {
      const commentReactions = await ctx.db
        .query("reactions")
        .withIndex("by_target", (q) => q.eq("targetId", id).eq("targetType", "comment"))
        .collect();
      for (const r of commentReactions) {
        await ctx.db.delete(r._id);
      }
      await ctx.db.delete(id);
    }

    return { success: true };
  },
});
