/**
 * Messages System
 * Feature: Phase 2.1 - Direct Messaging
 *
 * Handles sending, receiving, and managing messages within conversations.
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
 * Helper: verify user is a participant in conversation
 */
async function verifyParticipant(ctx: any, userId: string, conversationId: string) {
  return ctx.db
    .query("conversationParticipants")
    .withIndex("by_user_conversation", (q: any) =>
      q.eq("userId", userId).eq("conversationId", conversationId)
    )
    .unique()
}

/**
 * Send a message in a conversation
 */
export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    messageType: v.optional(
      v.union(v.literal("text"), v.literal("image"), v.literal("file"))
    ),
    attachmentUrl: v.optional(v.string()),
    attachmentName: v.optional(v.string()),
    replyToId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) throw new Error("Not authenticated")

    const conversation = await ctx.db.get(args.conversationId)
    if (!conversation) throw new Error("Conversation not found")

    // Verify membership
    const participant = await verifyParticipant(ctx, currentUser._id, args.conversationId)
    if (!participant) throw new Error("Not a participant in this conversation")

    // Validate content
    const content = args.content.trim()
    if (!content && !args.attachmentUrl) {
      throw new Error("Message content or attachment is required")
    }
    if (content.length > 5000) {
      throw new Error("Message too long (max 5000 characters)")
    }

    // Validate reply reference
    if (args.replyToId) {
      const replyMsg = await ctx.db.get(args.replyToId)
      if (!replyMsg || replyMsg.conversationId !== args.conversationId) {
        throw new Error("Reply message not found in this conversation")
      }
    }

    const now = Date.now()
    const messageType = args.messageType || "text"

    // Create the message
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: currentUser._id,
      content,
      messageType,
      attachmentUrl: args.attachmentUrl,
      attachmentName: args.attachmentName,
      replyToId: args.replyToId,
      status: "sent",
      isDeleted: false,
      createdAt: now,
    })

    // Update conversation with last message info
    const preview = content.length > 100 ? content.substring(0, 97) + "..." : content
    await ctx.db.patch(args.conversationId, {
      lastMessageId: messageId,
      lastMessageAt: now,
      lastMessagePreview: preview,
    })

    // Create notifications for other participants (non-muted)
    const allParticipants = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect()

    for (const p of allParticipants) {
      if (p.userId === currentUser._id) continue
      if (p.isMuted) continue

      // Create a notification via scheduler
      await ctx.scheduler.runAfter(0, "notifications:createNotification" as any, {
        recipientId: p.userId,
        actorId: currentUser._id,
        type: "mention" as const, // Using "mention" type for DM notifications
        referenceId: args.conversationId,
        message: conversation.type === "group"
          ? `${currentUser.name} sent a message in ${conversation.name}`
          : `${currentUser.name} sent you a message`,
      })
    }

    return messageId
  },
})

/**
 * Get messages for a conversation (paginated, newest first for loading)
 */
export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) return { messages: [], cursor: null }

    // Verify membership
    const participant = await verifyParticipant(ctx, currentUser._id, args.conversationId)
    if (!participant) return { messages: [], cursor: null }

    const limit = args.limit || 50

    let messagesQuery = ctx.db
      .query("messages")
      .withIndex("by_conversation", (q: any) => q.eq("conversationId", args.conversationId))
      .order("desc")

    const allMessages = await messagesQuery.collect()

    // Apply cursor-based pagination
    let startIndex = 0
    if (args.cursor) {
      const cursorTime = parseFloat(args.cursor)
      startIndex = allMessages.findIndex(m => m.createdAt < cursorTime)
      if (startIndex === -1) startIndex = allMessages.length
    }

    const pageMessages = allMessages.slice(startIndex, startIndex + limit)

    // Filter out messages deleted for this user
    const filteredMessages = pageMessages.filter(m => {
      if (m.deletedForUserIds && m.deletedForUserIds.includes(currentUser._id)) {
        return false
      }
      return true
    })

    // Enrich with sender info and reply info
    const enrichedMessages = []
    for (const msg of filteredMessages) {
      const sender = await ctx.db.get(msg.senderId)

      let replyToMessage = null
      if (msg.replyToId) {
        const replyMsg = await ctx.db.get(msg.replyToId)
        if (replyMsg && !replyMsg.isDeleted) {
          const replySender = await ctx.db.get(replyMsg.senderId)
          replyToMessage = {
            _id: replyMsg._id,
            content: replyMsg.content,
            senderName: replySender?.name || "Unknown",
          }
        }
      }

      enrichedMessages.push({
        ...msg,
        senderName: sender?.name || "Unknown",
        senderUsername: sender?.username,
        senderAvatar: sender?.profilePicture,
        replyToMessage,
        isOwn: msg.senderId === currentUser._id,
      })
    }

    // Determine next cursor
    const nextCursor = pageMessages.length === limit
      ? String(pageMessages[pageMessages.length - 1].createdAt)
      : null

    // Return in chronological order (oldest first) for display
    return {
      messages: enrichedMessages.reverse(),
      cursor: nextCursor,
    }
  },
})

/**
 * Delete a message
 * - "for me": hides from current user only
 * - "for everyone": marks as deleted (within 15 min window)
 */
export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
    deleteForEveryone: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) throw new Error("Not authenticated")

    const message = await ctx.db.get(args.messageId)
    if (!message) throw new Error("Message not found")

    // Verify membership
    const participant = await verifyParticipant(ctx, currentUser._id, message.conversationId)
    if (!participant) throw new Error("Not a participant in this conversation")

    if (args.deleteForEveryone) {
      // Only sender can delete for everyone
      if (message.senderId !== currentUser._id) {
        throw new Error("Only the sender can delete for everyone")
      }

      // 15-minute window for delete-for-everyone
      const fifteenMinutes = 15 * 60 * 1000
      if (Date.now() - message.createdAt > fifteenMinutes) {
        throw new Error("Cannot delete for everyone after 15 minutes")
      }

      await ctx.db.patch(args.messageId, {
        isDeleted: true,
        content: "This message was deleted",
      })
    } else {
      // Delete for me only
      const existingDeletedFor = message.deletedForUserIds || []
      if (!existingDeletedFor.includes(currentUser._id)) {
        await ctx.db.patch(args.messageId, {
          deletedForUserIds: [...existingDeletedFor, currentUser._id],
        })
      }
    }

    return { success: true }
  },
})

/**
 * Mark messages as read in a conversation
 */
export const markAsRead = mutation({
  args: {
    conversationId: v.id("conversations"),
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) throw new Error("Not authenticated")

    const participant = await verifyParticipant(ctx, currentUser._id, args.conversationId)
    if (!participant) throw new Error("Not a participant in this conversation")

    // Update participant's last read message
    await ctx.db.patch(participant._id, {
      lastReadMessageId: args.messageId,
      lastReadAt: Date.now(),
    })

    // Update message status to 'read' for messages sent to this user
    const message = await ctx.db.get(args.messageId)
    if (message && message.senderId !== currentUser._id && message.status !== "read") {
      await ctx.db.patch(args.messageId, { status: "read" })

      // Also mark all earlier unread messages as read
      const allMessages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
        .collect()

      for (const msg of allMessages) {
        if (
          msg.createdAt <= message.createdAt &&
          msg.senderId !== currentUser._id &&
          msg.status !== "read"
        ) {
          await ctx.db.patch(msg._id, { status: "read" })
        }
      }
    }

    return { success: true }
  },
})

/**
 * Edit a message (within 15-minute window)
 */
export const editMessage = mutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) throw new Error("Not authenticated")

    const message = await ctx.db.get(args.messageId)
    if (!message) throw new Error("Message not found")

    if (message.senderId !== currentUser._id) {
      throw new Error("Can only edit your own messages")
    }

    if (message.isDeleted) {
      throw new Error("Cannot edit a deleted message")
    }

    if (message.messageType !== "text") {
      throw new Error("Can only edit text messages")
    }

    // 15-minute edit window
    const fifteenMinutes = 15 * 60 * 1000
    if (Date.now() - message.createdAt > fifteenMinutes) {
      throw new Error("Cannot edit messages after 15 minutes")
    }

    const content = args.content.trim()
    if (!content) throw new Error("Message content is required")
    if (content.length > 5000) throw new Error("Message too long (max 5000 characters)")

    await ctx.db.patch(args.messageId, {
      content,
      updatedAt: Date.now(),
    })

    return { success: true }
  },
})

/**
 * Get read receipts for a message
 * Returns which participants have read up to this message
 */
export const getReadReceipts = query({
  args: {
    conversationId: v.id("conversations"),
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) return []

    const participant = await verifyParticipant(ctx, currentUser._id, args.conversationId)
    if (!participant) return []

    const message = await ctx.db.get(args.messageId)
    if (!message) return []

    const allParticipants = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect()

    const receipts = []
    for (const p of allParticipants) {
      if (p.userId === message.senderId) continue // Skip sender

      if (p.lastReadMessageId) {
        const lastRead = await ctx.db.get(p.lastReadMessageId)
        if (lastRead && lastRead.createdAt >= message.createdAt) {
          const user = await ctx.db.get(p.userId)
          receipts.push({
            userId: p.userId,
            name: user?.name || "Unknown",
            avatar: user?.profilePicture,
            readAt: p.lastReadAt,
          })
        }
      }
    }

    return receipts
  },
})

/**
 * Search messages within a conversation
 */
export const searchMessages = query({
  args: {
    conversationId: v.id("conversations"),
    searchQuery: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) return []

    const participant = await verifyParticipant(ctx, currentUser._id, args.conversationId)
    if (!participant) return []

    if (!args.searchQuery.trim()) return []

    const query = args.searchQuery.toLowerCase()
    const limit = args.limit || 20

    const allMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("desc")
      .collect()

    const results = []
    for (const msg of allMessages) {
      if (msg.isDeleted) continue
      if (msg.deletedForUserIds?.includes(currentUser._id)) continue

      if (msg.content.toLowerCase().includes(query)) {
        const sender = await ctx.db.get(msg.senderId)
        results.push({
          ...msg,
          senderName: sender?.name || "Unknown",
          senderAvatar: sender?.profilePicture,
        })

        if (results.length >= limit) break
      }
    }

    return results
  },
})

/**
 * React to a message with an emoji
 */
export const reactToMessage = mutation({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) throw new Error("Not authenticated")

    const message = await ctx.db.get(args.messageId)
    if (!message) throw new Error("Message not found")

    const participant = await verifyParticipant(ctx, currentUser._id, message.conversationId)
    if (!participant) throw new Error("Not a participant in this conversation")

    // Use the reactions table with message target
    const existingReaction = await ctx.db
      .query("reactions")
      .withIndex("by_user_target", (q) =>
        q.eq("userId", currentUser._id)
          .eq("targetId", args.messageId)
          .eq("targetType", "comment") // reuse "comment" type for message reactions
      )
      .unique()

    if (existingReaction) {
      // Remove if same emoji, update if different
      if (existingReaction.type === args.emoji) {
        await ctx.db.delete(existingReaction._id)
        return { action: "removed" }
      } else {
        await ctx.db.patch(existingReaction._id, {
          type: args.emoji as any,
          createdAt: Date.now(),
        })
        return { action: "updated" }
      }
    }

    // Create new reaction
    await ctx.db.insert("reactions", {
      userId: currentUser._id,
      targetId: args.messageId,
      targetType: "comment", // reuse for messages
      type: args.emoji as any,
      createdAt: Date.now(),
    })

    return { action: "added" }
  },
})
