import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Doc, Id } from "./_generated/dataModel"
import { api, internal } from "./_generated/api"

// Reaction types
export const reactionTypes = ["like", "love", "laugh", "wow", "sad", "scholarly"] as const
export type ReactionType = (typeof reactionTypes)[number]

// Add or update a reaction (upsert)
export const addReaction = mutation({
  args: {
    targetId: v.string(),
    targetType: v.union(v.literal("post"), v.literal("comment")),
    type: v.union(
      v.literal("like"),
      v.literal("love"),
      v.literal("laugh"),
      v.literal("wow"),
      v.literal("sad"),
      v.literal("scholarly")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    // Get user from database
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!user) {
      throw new Error("User not found")
    }

    // Check if user already reacted to this target
    const existingReaction = await ctx.db
      .query("reactions")
      .withIndex("by_user_target", (q) =>
        q
          .eq("userId", user._id)
          .eq("targetId", args.targetId)
          .eq("targetType", args.targetType)
      )
      .unique()

    if (existingReaction) {
      // If same reaction type, do nothing (already reacted)
      if (existingReaction.type === args.type) {
        return { success: true, action: "no-change" }
      }

      // Update to new reaction type
      await ctx.db.patch(existingReaction._id, {
        type: args.type,
        createdAt: Date.now(),
      })

      // Update target reaction counts
      await updateReactionCounts(ctx, args.targetId, args.targetType)

      return { success: true, action: "updated" }
    } else {
      // Create new reaction
      await ctx.db.insert("reactions", {
        userId: user._id,
        targetId: args.targetId,
        targetType: args.targetType,
        type: args.type,
        createdAt: Date.now(),
      })

      // Update target reaction counts
      await updateReactionCounts(ctx, args.targetId, args.targetType)

      // Create notification for target owner
      // Get the target (post or comment) to find the author
      let authorId: Id<"users"> | null = null
      if (args.targetType === "post") {
        const post = await ctx.db.get(args.targetId as Id<"posts">)
        if (post) authorId = post.authorId
      } else if (args.targetType === "comment") {
        const comment = await ctx.db.get(args.targetId as Id<"comments">)
        if (comment) authorId = comment.authorId
      }

      // Send notification if author exists and is not the same as the reactor
      if (authorId && authorId !== user._id) {
        const reactionEmoji = {
          like: "👍",
          love: "❤️",
          laugh: "😂",
          wow: "😮",
          sad: "😢",
          scholarly: "🎓",
        }[args.type]

        await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
          recipientId: authorId,
          actorId: user._id,
          type: "reaction" as const,
          referenceId: args.targetId,
          message: `${user.name} reacted ${reactionEmoji} to your ${args.targetType}`,
        })
      }

      // Award reputation to the target owner for receiving a like/reaction
      if (authorId && authorId !== user._id) {
        await ctx.scheduler.runAfter(0, internal.gamification.awardReputation, {
          userId: authorId,
          action: "receive_like",
        })
        await ctx.scheduler.runAfter(0, internal.gamification.checkAchievements, {
          userId: authorId,
        })
      }

      return { success: true, action: "created" }
    }
  },
})

// Remove a reaction
export const removeReaction = mutation({
  args: {
    targetId: v.string(),
    targetType: v.union(v.literal("post"), v.literal("comment")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!user) {
      throw new Error("User not found")
    }

    const existingReaction = await ctx.db
      .query("reactions")
      .withIndex("by_user_target", (q) =>
        q
          .eq("userId", user._id)
          .eq("targetId", args.targetId)
          .eq("targetType", args.targetType)
      )
      .unique()

    if (existingReaction) {
      await ctx.db.delete(existingReaction._id)

      // Update target reaction counts
      await updateReactionCounts(ctx, args.targetId, args.targetType)

      return { success: true }
    }

    return { success: false, message: "Reaction not found" }
  },
})

// Get reactions for a target (post or comment)
export const getReactions = query({
  args: {
    targetId: v.string(),
    targetType: v.union(v.literal("post"), v.literal("comment")),
  },
  handler: async (ctx, args) => {
    const reactions = await ctx.db
      .query("reactions")
      .withIndex("by_target", (q) =>
        q.eq("targetId", args.targetId).eq("targetType", args.targetType)
      )
      .collect()

    // Group by reaction type and count
    const counts: Record<ReactionType, number> = {
      like: 0,
      love: 0,
      laugh: 0,
      wow: 0,
      sad: 0,
      scholarly: 0,
    }

    reactions.forEach((reaction: any) => {
      counts[reaction.type as ReactionType]++
    })

    // Calculate total
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0)

    // Get top 3 reaction types
    const sorted = Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)

    return {
      counts,
      total,
      topReactions: sorted.map(([type, count]) => ({ type: type as ReactionType, count })),
    }
  },
})

// Get current user's reaction to a target
export const getUserReaction = query({
  args: {
    targetId: v.string(),
    targetType: v.union(v.literal("post"), v.literal("comment")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return null
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!user) {
      return null
    }

    const reaction = await ctx.db
      .query("reactions")
      .withIndex("by_user_target", (q) =>
        q
          .eq("userId", user._id)
          .eq("targetId", args.targetId)
          .eq("targetType", args.targetType)
      )
      .unique()

    return reaction ? reaction.type : null
  },
})

// Get users who reacted with a specific reaction type
export const getReactionUsers = query({
  args: {
    targetId: v.string(),
    targetType: v.union(v.literal("post"), v.literal("comment")),
    reactionType: v.optional(
      v.union(
        v.literal("like"),
        v.literal("love"),
        v.literal("laugh"),
        v.literal("wow"),
        v.literal("sad"),
        v.literal("scholarly")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let reactionsQuery = ctx.db
      .query("reactions")
      .withIndex("by_target", (q) =>
        q.eq("targetId", args.targetId).eq("targetType", args.targetType)
      )

    const reactions = await reactionsQuery.collect()

    // Filter by reaction type if specified
    const filteredReactions = args.reactionType
      ? reactions.filter((r) => r.type === args.reactionType)
      : reactions

    // Apply limit if specified
    const limitedReactions = args.limit
      ? filteredReactions.slice(0, args.limit)
      : filteredReactions

    // Fetch user details
    const usersWithReactions = await Promise.all(
      limitedReactions.map(async (reaction) => {
        const user = await ctx.db.get(reaction.userId)
        return {
          user: user
            ? {
                _id: user._id,
                name: user.name,
                profilePicture: user.profilePicture,
                role: user.role,
              }
            : null,
          reactionType: reaction.type,
          createdAt: reaction.createdAt,
        }
      })
    )

    return usersWithReactions.filter((item) => item.user !== null)
  },
})

// Helper function to update reaction counts on target (post/comment)
async function updateReactionCounts(
  ctx: any,
  targetId: string,
  targetType: "post" | "comment"
) {
  // Get all reactions for this target
  const reactions = await ctx.db
    .query("reactions")
    .withIndex("by_target", (q: any) => q.eq("targetId", targetId).eq("targetType", targetType))
    .collect()

  // Count by type
  const counts: Record<ReactionType, number> = {
    like: 0,
    love: 0,
    laugh: 0,
    wow: 0,
    sad: 0,
    scholarly: 0,
  }

  reactions.forEach((reaction: any) => {
    counts[reaction.type as ReactionType]++
  })

  // Update the target (post or comment)
  if (targetType === "post") {
    const postId = targetId as Id<"posts">
    await ctx.db.patch(postId, {
      reactionCounts: counts,
      likeCount: Object.values(counts).reduce((sum, count) => sum + count, 0), // Keep legacy field updated
    })
  } else if (targetType === "comment") {
    const commentId = targetId as Id<"comments">
    await ctx.db.patch(commentId, {
      reactionCounts: counts,
    })
  }
}
