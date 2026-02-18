/**
 * Presence & Typing Indicators
 * Feature: Phase 2.1 - Direct Messaging / Phase 2.3 - Presence & Activity Status
 *
 * Handles typing indicators, online presence, and activity status for conversations and users.
 */

import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

/**
 * Helper: get current authenticated user from identity
 */
async function getCurrentUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) return null
  return ctx.db
    .query("users")
    .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
    .unique()
}

/**
 * Set typing indicator for a conversation
 * Called with debounce from the client (e.g., on keypress)
 */
export const setTyping = mutation({
  args: {
    conversationId: v.id("conversations"),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) throw new Error("Not authenticated")

    // Verify membership
    const participant = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_user_conversation", (q) =>
        q.eq("userId", currentUser._id).eq("conversationId", args.conversationId)
      )
      .unique()

    if (!participant) throw new Error("Not a participant in this conversation")

    // Upsert typing indicator
    const existingIndicator = await ctx.db
      .query("typingIndicators")
      .withIndex("by_user_conversation", (q) =>
        q.eq("userId", currentUser._id).eq("conversationId", args.conversationId)
      )
      .unique()

    if (existingIndicator) {
      await ctx.db.patch(existingIndicator._id, {
        isTyping: args.isTyping,
        updatedAt: Date.now(),
      })
    } else {
      await ctx.db.insert("typingIndicators", {
        conversationId: args.conversationId,
        userId: currentUser._id,
        isTyping: args.isTyping,
        updatedAt: Date.now(),
      })
    }

    return { success: true }
  },
})

/**
 * Get typing indicators for a conversation
 * Returns list of users who are currently typing
 */
export const getTypingUsers = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) return []

    // Get all typing indicators for this conversation
    const indicators = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect()

    const now = Date.now()
    const typingTimeout = 10000 // 10 seconds — stale typing indicator

    const typingUsers = []
    for (const indicator of indicators) {
      // Skip self, not typing, or stale
      if (indicator.userId === currentUser._id) continue
      if (!indicator.isTyping) continue
      if (now - indicator.updatedAt > typingTimeout) continue

      const user = await ctx.db.get(indicator.userId)
      if (user) {
        typingUsers.push({
          _id: user._id,
          name: user.name,
          username: user.username,
          profilePicture: user.profilePicture,
        })
      }
    }

    return typingUsers
  },
})

/**
 * Clear stale typing indicators (can be called periodically)
 */
export const clearStaleTyping = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const typingTimeout = 10000 // 10 seconds

    // Note: This is a cleanup function, not user-facing
    // In production, this would be a cron job
    const allIndicators = await ctx.db.query("typingIndicators").collect()

    let cleared = 0
    for (const indicator of allIndicators) {
      if (indicator.isTyping && now - indicator.updatedAt > typingTimeout) {
        await ctx.db.patch(indicator._id, { isTyping: false })
        cleared++
      }
    }

    return { cleared }
  },
})

// =============================================
// Phase 2.3 — Presence & Activity Status
// =============================================

/**
 * Update user's activity status (online, away, dnd, invisible)
 */
export const updateStatus = mutation({
  args: {
    status: v.union(
      v.literal("online"),
      v.literal("away"),
      v.literal("dnd"),
      v.literal("invisible")
    ),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) throw new Error("Not authenticated")

    await ctx.db.patch(currentUser._id, {
      status: args.status,
      lastSeenAt: Date.now(),
      updatedAt: Date.now(),
    })

    return { success: true }
  },
})

/**
 * Set custom status message (e.g., "In a meeting", "Studying 📚")
 */
export const setCustomStatus = mutation({
  args: {
    customStatus: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) throw new Error("Not authenticated")

    const status = args.customStatus.trim()
    if (status.length > 100) {
      throw new Error("Custom status too long (max 100 characters)")
    }

    await ctx.db.patch(currentUser._id, {
      customStatus: status || undefined, // clear if empty
      updatedAt: Date.now(),
    })

    return { success: true }
  },
})

/**
 * Heartbeat — update lastSeenAt to track activity.
 * Called every 60s from the client when the tab is active.
 */
export const heartbeat = mutation({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) return

    const updates: any = {
      lastSeenAt: Date.now(),
      updatedAt: Date.now(),
    }

    // Auto-set to online if not explicitly set or if was away
    if (!currentUser.status || currentUser.status === "away") {
      updates.status = "online"
    }

    await ctx.db.patch(currentUser._id, updates)
  },
})

/**
 * Get online users — users active within the last 5 minutes.
 * Respects showOnlineStatus privacy setting and invisible mode.
 */
export const getOnlineUsers = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) return []

    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    const limit = args.limit || 50

    // Get users with recent activity
    const allUsers = await ctx.db
      .query("users")
      .collect()

    const onlineUsers = allUsers
      .filter((u) => {
        if (u._id === currentUser._id) return false
        // Respect privacy: if showOnlineStatus is explicitly false, hide
        if (u.showOnlineStatus === false) return false
        // Invisible users don't appear online
        if (u.status === "invisible") return false
        // Must have recent activity
        if (!u.lastSeenAt || u.lastSeenAt < fiveMinutesAgo) return false
        return true
      })
      .map((u) => ({
        _id: u._id,
        name: u.name,
        username: u.username,
        profilePicture: u.profilePicture,
        status: u.status || "online",
        customStatus: u.customStatus,
        lastSeenAt: u.lastSeenAt,
      }))
      .slice(0, limit)

    return onlineUsers
  },
})

/**
 * Get presence info for a specific user.
 * Returns status, customStatus, lastSeenAt — privacy-aware.
 */
export const getUserPresence = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) return null

    const user = await ctx.db.get(args.userId)
    if (!user) return null

    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000

    // Self always sees own status
    if (user._id === currentUser._id) {
      return {
        status: user.status || "online",
        customStatus: user.customStatus,
        lastSeenAt: user.lastSeenAt,
        isOnline: !!(user.lastSeenAt && user.lastSeenAt >= fiveMinutesAgo),
        showOnlineStatus: user.showOnlineStatus !== false,
      }
    }

    // Privacy: if user hides online status
    if (user.showOnlineStatus === false) {
      return {
        status: null,
        customStatus: user.customStatus, // custom status can still be visible
        lastSeenAt: null,
        isOnline: false,
        showOnlineStatus: false,
      }
    }

    // Invisible users appear offline
    if (user.status === "invisible") {
      return {
        status: "offline" as const,
        customStatus: user.customStatus,
        lastSeenAt: null,
        isOnline: false,
        showOnlineStatus: true,
      }
    }

    const isOnline = !!(user.lastSeenAt && user.lastSeenAt >= fiveMinutesAgo)

    return {
      status: isOnline ? (user.status || "online") : "offline",
      customStatus: user.customStatus,
      lastSeenAt: user.lastSeenAt,
      isOnline,
      showOnlineStatus: true,
    }
  },
})

/**
 * Update privacy setting for online status visibility
 */
export const updateOnlineStatusVisibility = mutation({
  args: {
    showOnlineStatus: v.boolean(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) throw new Error("Not authenticated")

    await ctx.db.patch(currentUser._id, {
      showOnlineStatus: args.showOnlineStatus,
      updatedAt: Date.now(),
    })

    return { success: true }
  },
})
