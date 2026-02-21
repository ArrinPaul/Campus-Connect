import { v } from "convex/values"
import { query, mutation } from "./_generated/server"
import { api, internal } from "./_generated/api"

/**
 * Follow a user
 * Validates: Requirements 7.1, 7.2, 7.5
 */
export const followUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get the authenticated user identity
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Find the current user
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!currentUser) {
      throw new Error("User not found")
    }

    // Check if trying to follow self
    if (currentUser._id === args.userId) {
      throw new Error("Cannot follow yourself")
    }

    // Check if target user exists
    const targetUser = await ctx.db.get(args.userId)
    if (!targetUser) {
      throw new Error("Target user not found")
    }

    // Check if already following
    const existingFollow = await ctx.db
      .query("follows")
      .withIndex("by_follower_and_following", (q) =>
        q.eq("followerId", currentUser._id).eq("followingId", args.userId)
      )
      .first()

    if (existingFollow) {
      throw new Error("Already following this user")
    }

    // Create follow record
    await ctx.db.insert("follows", {
      followerId: currentUser._id,
      followingId: args.userId,
      createdAt: Date.now(),
    })

    // Update follower count for target user
    await ctx.db.patch(args.userId, {
      followerCount: targetUser.followerCount + 1,
    })

    // Update following count for current user
    await ctx.db.patch(currentUser._id, {
      followingCount: currentUser.followingCount + 1,
    })

    // Create notification for the followed user
    await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
      recipientId: args.userId,
      actorId: currentUser._id,
      type: "follow" as const,
      message: `${currentUser.name} started following you`,
    })

    return true
  },
})

/**
 * Unfollow a user
 * Validates: Requirements 7.3, 7.4
 */
export const unfollowUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get the authenticated user identity
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Find the current user
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!currentUser) {
      throw new Error("User not found")
    }

    // Check if target user exists
    const targetUser = await ctx.db.get(args.userId)
    if (!targetUser) {
      throw new Error("Target user not found")
    }

    // Find the follow record
    const followRecord = await ctx.db
      .query("follows")
      .withIndex("by_follower_and_following", (q) =>
        q.eq("followerId", currentUser._id).eq("followingId", args.userId)
      )
      .first()

    if (!followRecord) {
      throw new Error("Not following this user")
    }

    // Delete follow record
    await ctx.db.delete(followRecord._id)

    // Update follower count for target user
    await ctx.db.patch(args.userId, {
      followerCount: Math.max(0, targetUser.followerCount - 1),
    })

    // Update following count for current user
    await ctx.db.patch(currentUser._id, {
      followingCount: Math.max(0, currentUser.followingCount - 1),
    })

    return true
  },
})

/**
 * Check if current user is following a specific user
 * Validates: Requirements 7.1, 12.4
 */
export const isFollowing = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get the authenticated user identity
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return false
    }

    // Find the current user
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!currentUser) {
      return false
    }

    // Check if follow record exists
    const followRecord = await ctx.db
      .query("follows")
      .withIndex("by_follower_and_following", (q) =>
        q.eq("followerId", currentUser._id).eq("followingId", args.userId)
      )
      .first()

    return followRecord !== null
  },
})

/**
 * Get followers of a user
 * Validates: Requirements 7.7, 12.4
 */
export const getFollowers = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Get all follow records where the user is being followed
    const followRecords = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .collect()

    // Get follower user objects
    const followers = await Promise.all(
      followRecords.map(async (follow) => {
        const user = await ctx.db.get(follow.followerId)
        return user
      })
    )

    // Filter out any null values (in case user was deleted)
    return followers.filter((user) => user !== null)
  },
})

/**
 * Get users that a user is following
 * Validates: Requirements 7.7, 12.4
 */
export const getFollowing = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Get all follow records where the user is the follower
    const followRecords = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .collect()

    // Get following user objects
    const following = await Promise.all(
      followRecords.map(async (follow) => {
        const user = await ctx.db.get(follow.followingId)
        return user
      })
    )

    // Filter out any null values (in case user was deleted)
    return following.filter((user) => user !== null)
  },
})
