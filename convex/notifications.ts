/**
 * Notifications System
 * Feature: Phase 1.4 - Notification System
 * 
 * Handles creating, reading, and managing user notifications.
 */

import { mutation, query, internalMutation } from "./_generated/server"
import { v } from "convex/values"
import { sanitizeText } from "./sanitize"
import { NOTIFICATION_MAX_LENGTH } from "./validation_constants"

/**
 * Create a new notification
 * Called internally by other mutations (reactions, comments, follows, etc.)
 * This is an internalMutation — not callable from the client directly.
 */
export const createNotification = internalMutation({
  args: {
    recipientId: v.id("users"),
    actorId: v.id("users"),
    type: v.union(
      v.literal("reaction"),
      v.literal("comment"),
      v.literal("mention"),
      v.literal("follow"),
      v.literal("reply"),
      v.literal("event"),
      v.literal("message")
    ),
    referenceId: v.optional(v.string()),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate and sanitize message
    const message = sanitizeText(args.message)
    if (message.length > NOTIFICATION_MAX_LENGTH) {
      throw new Error(`Notification message too long (max ${NOTIFICATION_MAX_LENGTH} characters)`)
    }

    // Don't create notification if actor and recipient are the same
    if (args.recipientId === args.actorId) {
      return null
    }

    // Check recipient's notification preferences
    const recipient = await ctx.db.get(args.recipientId)
    if (recipient?.notificationPreferences) {
      const prefs = recipient.notificationPreferences
      const typeToPreference: Record<string, boolean | undefined> = {
        reaction: prefs.reactions,
        comment: prefs.comments,
        mention: prefs.mentions,
        follow: prefs.follows,
        reply: prefs.comments, // replies are a sub-type of comments
      }
      if (typeToPreference[args.type] === false) {
        return null // User disabled this notification type
      }
    }

    // Create the notification
    const notificationId = await ctx.db.insert("notifications", {
      recipientId: args.recipientId,
      actorId: args.actorId,
      type: args.type,
      referenceId: args.referenceId,
      message: message,
      isRead: false,
      createdAt: Date.now(),
    })

    return notificationId
  },
})

/**
 * Get notifications for the current user
 * Supports filtering by type and pagination
 */
export const getNotifications = query({
  args: {
    filter: v.optional(
      v.union(
        v.literal("all"),
        v.literal("reaction"),
        v.literal("comment"),
        v.literal("mention"),
        v.literal("follow"),
        v.literal("reply")
      )
    ),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return { notifications: [], cursor: null }
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!user) {
      return { notifications: [], cursor: null }
    }

    const userId = user._id

    const limit = Math.min(args.limit || 20, 100)

    // Get notifications for the user using proper take-based pagination
    let notificationsQuery = ctx.db
      .query("notifications")
      .withIndex("by_recipient", (q) => q.eq("recipientId", userId))
      .order("desc")

    // If we have a cursor (notification ID), skip past it
    if (args.cursor) {
      try {
        const cursorDoc = await ctx.db.get(args.cursor as any) as any
        if (cursorDoc) {
          notificationsQuery = notificationsQuery.filter((q) =>
            q.lt(q.field("createdAt"), cursorDoc.createdAt)
          )
        }
      } catch {
        // Invalid cursor — return results from the beginning
      }
    }

    // Fetch limit+1 to check if there are more
    const allFetched = await notificationsQuery.take(
      args.filter && args.filter !== "all" ? limit * 5 : limit + 1
    )

    // Apply filter if needed
    let filteredNotifications = allFetched
    if (args.filter && args.filter !== "all") {
      filteredNotifications = allFetched.filter(
        (n) => n.type === args.filter
      )
    }

    // Paginate
    const hasMore = filteredNotifications.length > limit
    const paginatedNotifications = filteredNotifications.slice(0, limit)

    // Get actor details for each notification
    const notificationsWithActors = await Promise.all(
      paginatedNotifications.map(async (notification) => {
        const actor = await ctx.db.get(notification.actorId)
        return {
          ...notification,
          actor: actor
            ? {
                _id: actor._id,
                name: actor.name,
                profilePicture: actor.profilePicture,
              }
            : null,
        }
      })
    )

    // Calculate next cursor (use last notification's ID for cursor-based pagination)
    const nextCursor = hasMore && paginatedNotifications.length > 0
      ? paginatedNotifications[paginatedNotifications.length - 1]._id
      : null

    return {
      notifications: notificationsWithActors,
      cursor: nextCursor,
    }
  },
})

/**
 * Mark a single notification as read
 */
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!user) {
      throw new Error("User not found")
    }

    const notification = await ctx.db.get(args.notificationId)
    if (!notification) {
      throw new Error("Notification not found")
    }

    // Verify the notification belongs to the current user
    if (notification.recipientId !== user._id) {
      throw new Error("Unauthorized")
    }

    await ctx.db.patch(args.notificationId, {
      isRead: true,
    })

    return { success: true }
  },
})

/**
 * Mark all notifications as read for the current user
 */
export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!user) {
      throw new Error("User not found")
    }

    const userId = user._id

    // Get all unread notifications
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_recipient_unread", (q) =>
        q.eq("recipientId", userId).eq("isRead", false)
      )
      .collect()

    // Mark them all as read
    await Promise.all(
      unreadNotifications.map((notification) =>
        ctx.db.patch(notification._id, { isRead: true })
      )
    )

    return {
      success: true,
      count: unreadNotifications.length,
    }
  },
})

/**
 * Get count of unread notifications for the current user
 * Used for the notification badge
 */
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return 0
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!user) {
      return 0
    }

    const userId = user._id

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_recipient_unread", (q) =>
        q.eq("recipientId", userId).eq("isRead", false)
      )
      .collect()

    return unreadNotifications.length
  },
})

/**
 * Delete a notification
 */
export const deleteNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!user) {
      throw new Error("User not found")
    }

    const notification = await ctx.db.get(args.notificationId)
    if (!notification) {
      throw new Error("Notification not found")
    }

    // Verify the notification belongs to the current user
    if (notification.recipientId !== user._id) {
      throw new Error("Unauthorized")
    }

    await ctx.db.delete(args.notificationId)

    return { success: true }
  },
})

/**
 * Get recent notifications for dropdown (limited to 5)
 */
export const getRecentNotifications = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return []
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!user) {
      return []
    }

    const userId = user._id

    // Get the 5 most recent notifications
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_recipient", (q) => q.eq("recipientId", userId))
      .order("desc")
      .take(5)

    // Get actor details for each notification
    const notificationsWithActors = await Promise.all(
      notifications.map(async (notification) => {
        const actor = await ctx.db.get(notification.actorId)
        return {
          ...notification,
          actor: actor
            ? {
                _id: actor._id,
                name: actor.name,
                profilePicture: actor.profilePicture,
              }
            : null,
        }
      })
    )

    return notificationsWithActors
  },
})
