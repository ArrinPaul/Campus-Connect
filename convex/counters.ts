import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

/**
 * =================================================================
 * COUNTER MANAGEMENT SYSTEM
 * =================================================================
 * A centralized set of internal mutations for safely incrementing and
 * decrementing denormalized counters. This prevents data drift by
 * ensuring that all counter logic is in one place and can be updated
 * atomically.
 */

// ------------------------- Post Counters -------------------------

export const incrementPostCounts = internalMutation({
  args: {
    postId: v.id("posts"),
    commentCount: v.optional(v.number()),
    shareCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) return;

    const updates: Partial<Doc<"posts">> = {};
    if (args.commentCount) {
      updates.commentCount = (post.commentCount ?? 0) + args.commentCount;
    }
    if (args.shareCount) {
      updates.shareCount = (post.shareCount ?? 0) + args.shareCount;
    }
    await ctx.db.patch(args.postId, updates);
  },
});

export const decrementPostCounts = internalMutation({
    args: {
      postId: v.id("posts"),
      commentCount: v.optional(v.number()),
      shareCount: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
      const post = await ctx.db.get(args.postId);
      if (!post) return;
  
      const updates: Partial<Doc<"posts">> = {};
      if (args.commentCount) {
        updates.commentCount = Math.max(0, (post.commentCount ?? 0) - args.commentCount);
      }
      if (args.shareCount) {
        updates.shareCount = Math.max(0, (post.shareCount ?? 0) - args.shareCount);
      }
      await ctx.db.patch(args.postId, updates);
    },
});

export const updateReactionCounts = internalMutation({
    args: {
        targetId: v.id("posts"), // Or comments, etc.
        reactionType: v.string(),
        delta: v.number(), // +1 for increment, -1 for decrement
    },
    handler: async (ctx, args) => {
        const target = await ctx.db.get(args.targetId);
        if (!target) return;
        
        const reactionCounts = target.reactionCounts ?? { like: 0, love: 0, laugh: 0, wow: 0, sad: 0, scholarly: 0 };
        const currentCount = reactionCounts[args.reactionType as keyof typeof reactionCounts] ?? 0;

        const newCounts = {
            ...reactionCounts,
            [args.reactionType]: Math.max(0, currentCount + args.delta)
        };

        // Also update legacy likeCount for backward compatibility
        if(args.reactionType === 'like') {
            const legacyLikeCount = (target as Doc<"posts">).likeCount ?? 0;
            await ctx.db.patch(args.targetId, { reactionCounts: newCounts, likeCount: Math.max(0, legacyLikeCount + args.delta) });
        } else {
            await ctx.db.patch(args.targetId, { reactionCounts: newCounts });
        }
    }
})


// ------------------------- User Counters -------------------------

export const updateUserFollowCounts = internalMutation({
    args: {
      userId: v.id("users"),
      followerDelta: v.optional(v.number()),
      followingDelta: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) return;

        const updates: Partial<Doc<"users">> = {};
        if (args.followerDelta) {
            updates.followerCount = Math.max(0, (user.followerCount ?? 0) + args.followerDelta);
        }
        if (args.followingDelta) {
            updates.followingCount = Math.max(0, (user.followingCount ?? 0) + args.followingDelta);
        }
        await ctx.db.patch(args.userId, updates);
    }
})

// ------------------------- Community Counters -------------------------

export const updateCommunityMemberCount = internalMutation({
    args: {
        communityId: v.id("communities"),
        delta: v.number(),
    },
    handler: async (ctx, args) => {
        const community = await ctx.db.get(args.communityId);
        if(!community) return;

        await ctx.db.patch(args.communityId, {
            memberCount: Math.max(0, (community.memberCount ?? 0) + args.delta),
        })
    }
})

// ------------------------- Comment Counters -------------------------
export const updateCommentReplyCount = internalMutation({
    args: {
        commentId: v.id("comments"),
        delta: v.number(),
    },
    handler: async (ctx, args) => {
        const comment = await ctx.db.get(args.commentId);
        if(!comment) return;

        await ctx.db.patch(args.commentId, {
            replyCount: Math.max(0, (comment.replyCount ?? 0) + args.delta),
        })
    }
})
