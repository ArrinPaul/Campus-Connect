/**
 * Conversations System
 * Feature: Phase 2.1 - Direct Messaging / Phase 2.2 - Group Chat
 *
 * Handles creating and managing conversations (both DMs and groups).
 */

import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Id } from "./_generated/dataModel"

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
 * Get or create a 1-on-1 direct conversation
 * If a conversation already exists between the two users, return it.
 * Otherwise, create a new one.
 */
export const getOrCreateConversation = mutation({
  args: {
    otherUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) throw new Error("Not authenticated")

    // Verify the other user exists
    const otherUser = await ctx.db.get(args.otherUserId)
    if (!otherUser) throw new Error("User not found")

    // Can't message yourself
    if (currentUser._id === args.otherUserId) {
      throw new Error("Cannot create conversation with yourself")
    }

    // Sort participant IDs for consistent lookup
    const participantIds = [currentUser._id, args.otherUserId].sort() as [Id<"users">, Id<"users">]

    // Look for existing DM conversation
    // We need to search through conversations where both users are participants
    const existingParticipant = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .collect()

    for (const participant of existingParticipant) {
      const conversation = await ctx.db.get(participant.conversationId)
      if (conversation && conversation.type === "direct") {
        // Check if the other user is also in this conversation
        const otherParticipant = await ctx.db
          .query("conversationParticipants")
          .withIndex("by_user_conversation", (q) =>
            q.eq("userId", args.otherUserId).eq("conversationId", participant.conversationId)
          )
          .unique()

        if (otherParticipant) {
          return conversation._id
        }
      }
    }

    // Create new conversation
    const conversationId = await ctx.db.insert("conversations", {
      type: "direct",
      participantIds,
      createdAt: Date.now(),
    })

    // Create participant records
    const now = Date.now()
    await ctx.db.insert("conversationParticipants", {
      conversationId,
      userId: currentUser._id,
      isMuted: false,
      joinedAt: now,
    })
    await ctx.db.insert("conversationParticipants", {
      conversationId,
      userId: args.otherUserId,
      isMuted: false,
      joinedAt: now,
    })

    return conversationId
  },
})

/**
 * Get all conversations for the current user
 * Returns conversations with previews (last message, unread count, other user info)
 */
export const getConversations = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) return []

    const limit = Math.min(args.limit || 50, 100)

    // Get all participant records for the user
    const participantRecords = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .collect()

    // Get conversations with details
    const conversations = []
    for (const record of participantRecords) {
      const conversation = await ctx.db.get(record.conversationId)
      if (!conversation) continue

      // Get the other participant(s) info
      const allParticipants = await ctx.db
        .query("conversationParticipants")
        .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
        .collect()

      const otherParticipantRecords = allParticipants.filter(
        (p) => p.userId !== currentUser._id
      )

      // Get user info for other participants
      const otherUsers = []
      for (const op of otherParticipantRecords) {
        const user = await ctx.db.get(op.userId)
        if (user) {
          otherUsers.push({
            _id: user._id,
            name: user.name,
            username: user.username,
            profilePicture: user.profilePicture,
          })
        }
      }

      // Calculate unread count
      let unreadCount = 0
      if (conversation.lastMessageId) {
        const lastReadId = record.lastReadMessageId
        if (!lastReadId) {
          // Never read any messages — count all
          const allMessages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
            .collect()
          unreadCount = allMessages.filter(
            (m) => m.senderId !== currentUser._id && !m.isDeleted
          ).length
        } else {
          // Count messages after last read
          const lastReadMsg = await ctx.db.get(lastReadId)
          if (lastReadMsg) {
            const messagesAfterRead = await ctx.db
              .query("messages")
              .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
              .collect()
            unreadCount = messagesAfterRead.filter(
              (m) =>
                m.createdAt > lastReadMsg.createdAt &&
                m.senderId !== currentUser._id &&
                !m.isDeleted
            ).length
          }
        }
      }

      conversations.push({
        ...conversation,
        otherUsers,
        unreadCount,
        isMuted: record.isMuted,
        myRole: record.role,
      })
    }

    // Sort by last message time (most recent first)
    conversations.sort((a, b) => (b.lastMessageAt || b.createdAt) - (a.lastMessageAt || a.createdAt))

    return conversations.slice(0, limit)
  },
})

/**
 * Get a single conversation by ID (with participant details)
 */
export const getConversation = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) return null

    const conversation = await ctx.db.get(args.conversationId)
    if (!conversation) return null

    // Verify user is a participant
    const participant = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_user_conversation", (q) =>
        q.eq("userId", currentUser._id).eq("conversationId", args.conversationId)
      )
      .unique()

    if (!participant) return null

    // Get all participants info
    const allParticipants = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
      .collect()

    const participantDetails = []
    for (const p of allParticipants) {
      const user = await ctx.db.get(p.userId)
      if (user) {
        participantDetails.push({
          _id: user._id,
          name: user.name,
          username: user.username,
          profilePicture: user.profilePicture,
          role: p.role,
          joinedAt: p.joinedAt,
          isMuted: p.isMuted,
        })
      }
    }

    return {
      ...conversation,
      participants: participantDetails,
      myRole: participant.role,
      isMuted: participant.isMuted,
    }
  },
})

/**
 * Mute/unmute a conversation
 */
export const muteConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
    isMuted: v.boolean(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) throw new Error("Not authenticated")

    const participant = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_user_conversation", (q) =>
        q.eq("userId", currentUser._id).eq("conversationId", args.conversationId)
      )
      .unique()

    if (!participant) throw new Error("Not a participant in this conversation")

    await ctx.db.patch(participant._id, { isMuted: args.isMuted })
    return { success: true }
  },
})

/**
 * Delete a conversation (soft — removes participant record for the user)
 */
export const deleteConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) throw new Error("Not authenticated")

    const participant = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_user_conversation", (q) =>
        q.eq("userId", currentUser._id).eq("conversationId", args.conversationId)
      )
      .unique()

    if (!participant) throw new Error("Not a participant in this conversation")

    // For DMs, just remove the participant record
    await ctx.db.delete(participant._id)

    // Check if any participants remain
    const remaining = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect()

    // If no participants left, delete the conversation
    if (remaining.length === 0) {
      await ctx.db.delete(args.conversationId)
    }

    return { success: true }
  },
})

/**
 * Get unread message count across all conversations
 */
export const getTotalUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) return 0

    const participantRecords = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .collect()

    let totalUnread = 0
    for (const record of participantRecords) {
      if (record.isMuted) continue

      const conversation = await ctx.db.get(record.conversationId)
      if (!conversation || !conversation.lastMessageId) continue

      const lastReadId = record.lastReadMessageId
      if (!lastReadId) {
        // Never read — count all messages not from self
        const allMessages = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
          .collect()
        totalUnread += allMessages.filter(
          (m) => m.senderId !== currentUser._id && !m.isDeleted
        ).length
      } else {
        const lastReadMsg = await ctx.db.get(lastReadId)
        if (lastReadMsg) {
          const messagesAfterRead = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
            .collect()
          totalUnread += messagesAfterRead.filter(
            (m) =>
              m.createdAt > lastReadMsg.createdAt &&
              m.senderId !== currentUser._id &&
              !m.isDeleted
          ).length
        }
      }
    }

    return totalUnread
  },
})

/**
 * Search conversations by user name or group name
 */
export const searchConversations = query({
  args: {
    searchQuery: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) return []

    if (!args.searchQuery.trim()) return []

    const query = args.searchQuery.toLowerCase()

    // Get all user's conversations
    const participantRecords = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .collect()

    const results = []
    for (const record of participantRecords) {
      const conversation = await ctx.db.get(record.conversationId)
      if (!conversation) continue

      let matches = false

      // For groups, search by group name
      if (conversation.type === "group" && conversation.name) {
        if (conversation.name.toLowerCase().includes(query)) {
          matches = true
        }
      }

      // Search by participant names
      if (!matches) {
        const allParticipants = await ctx.db
          .query("conversationParticipants")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
          .collect()

        for (const p of allParticipants) {
          if (p.userId === currentUser._id) continue
          const user = await ctx.db.get(p.userId)
          if (user) {
            if (
              user.name.toLowerCase().includes(query) ||
              (user.username && user.username.toLowerCase().includes(query))
            ) {
              matches = true
              break
            }
          }
        }
      }

      if (matches) {
        // Get other users for display
        const allParts = await ctx.db
          .query("conversationParticipants")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
          .collect()

        const otherUsers = []
        for (const p of allParts) {
          if (p.userId === currentUser._id) continue
          const user = await ctx.db.get(p.userId)
          if (user) {
            otherUsers.push({
              _id: user._id,
              name: user.name,
              username: user.username,
              profilePicture: user.profilePicture,
            })
          }
        }

        results.push({
          ...conversation,
          otherUsers,
          isMuted: record.isMuted,
        })
      }
    }

    return results
  },
})

// =============================================
// Group Chat Operations (Phase 2.2)
// =============================================

/**
 * Create a new group conversation
 */
export const createGroup = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    memberIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) throw new Error("Not authenticated")

    if (!args.name.trim()) throw new Error("Group name is required")
    if (args.name.length > 100) throw new Error("Group name too long (max 100 characters)")
    if (args.description && args.description.length > 1000) throw new Error("Description too long (max 1000 characters)")
    if (args.memberIds.length === 0) throw new Error("At least one member is required")
    if (args.memberIds.length > 255) throw new Error("Maximum 256 members per group")

    // Verify all members exist and remove duplicates
    const uniqueMemberIds = Array.from(new Set(args.memberIds.filter(id => id !== currentUser._id)))
    for (const memberId of uniqueMemberIds) {
      const user = await ctx.db.get(memberId)
      if (!user) throw new Error(`User ${memberId} not found`)
    }

    const allParticipantIds = [currentUser._id, ...uniqueMemberIds].sort() as Id<"users">[]

    const conversationId = await ctx.db.insert("conversations", {
      type: "group",
      participantIds: allParticipantIds,
      name: args.name.trim(),
      description: args.description?.trim(),
      createdBy: currentUser._id,
      createdAt: Date.now(),
    })

    const now = Date.now()

    // Add creator as owner
    await ctx.db.insert("conversationParticipants", {
      conversationId,
      userId: currentUser._id,
      role: "owner",
      isMuted: false,
      joinedAt: now,
    })

    // Add all other members
    for (const memberId of uniqueMemberIds) {
      await ctx.db.insert("conversationParticipants", {
        conversationId,
        userId: memberId,
        role: "member",
        isMuted: false,
        joinedAt: now,
      })
    }

    // Create system message
    await ctx.db.insert("messages", {
      conversationId,
      senderId: currentUser._id,
      content: `${currentUser.name} created the group "${args.name.trim()}"`,
      messageType: "system",
      status: "sent",
      isDeleted: false,
      createdAt: now,
    })

    return conversationId
  },
})

/**
 * Add a member to a group (admin/owner only)
 */
export const addGroupMember = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) throw new Error("Not authenticated")

    const conversation = await ctx.db.get(args.conversationId)
    if (!conversation || conversation.type !== "group") {
      throw new Error("Group not found")
    }

    // Check caller is admin/owner
    const callerParticipant = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_user_conversation", (q) =>
        q.eq("userId", currentUser._id).eq("conversationId", args.conversationId)
      )
      .unique()

    if (!callerParticipant || (callerParticipant.role !== "owner" && callerParticipant.role !== "admin")) {
      throw new Error("Only admins can add members")
    }

    // Check member count
    const existingMembers = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect()

    if (existingMembers.length >= 256) {
      throw new Error("Group is at maximum capacity (256 members)")
    }

    // Check if already a member
    const existing = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_user_conversation", (q) =>
        q.eq("userId", args.userId).eq("conversationId", args.conversationId)
      )
      .unique()

    if (existing) throw new Error("User is already a member")

    // Verify user exists
    const newUser = await ctx.db.get(args.userId)
    if (!newUser) throw new Error("User not found")

    await ctx.db.insert("conversationParticipants", {
      conversationId: args.conversationId,
      userId: args.userId,
      role: "member",
      isMuted: false,
      joinedAt: Date.now(),
    })

    // Update participantIds on conversation
    const updatedIds = [...conversation.participantIds, args.userId].sort() as Id<"users">[]
    await ctx.db.patch(args.conversationId, { participantIds: updatedIds })

    // System message
    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: currentUser._id,
      content: `${currentUser.name} added ${newUser.name} to the group`,
      messageType: "system",
      status: "sent",
      isDeleted: false,
      createdAt: Date.now(),
    })

    return { success: true }
  },
})

/**
 * Remove a member from a group (admin/owner only)
 */
export const removeGroupMember = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) throw new Error("Not authenticated")

    const conversation = await ctx.db.get(args.conversationId)
    if (!conversation || conversation.type !== "group") {
      throw new Error("Group not found")
    }

    // Check caller is admin/owner
    const callerParticipant = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_user_conversation", (q) =>
        q.eq("userId", currentUser._id).eq("conversationId", args.conversationId)
      )
      .unique()

    if (!callerParticipant || (callerParticipant.role !== "owner" && callerParticipant.role !== "admin")) {
      throw new Error("Only admins can remove members")
    }

    // Can't remove the owner
    const targetParticipant = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_user_conversation", (q) =>
        q.eq("userId", args.userId).eq("conversationId", args.conversationId)
      )
      .unique()

    if (!targetParticipant) throw new Error("User is not a member")
    if (targetParticipant.role === "owner") throw new Error("Cannot remove the group owner")

    // Admin cannot remove another admin (only owner can)
    if (targetParticipant.role === "admin" && callerParticipant.role !== "owner") {
      throw new Error("Only the owner can remove admins")
    }

    const removedUser = await ctx.db.get(args.userId)

    await ctx.db.delete(targetParticipant._id)

    // Update participantIds
    const updatedIds = conversation.participantIds.filter(id => id !== args.userId)
    await ctx.db.patch(args.conversationId, { participantIds: updatedIds })

    // System message
    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: currentUser._id,
      content: `${currentUser.name} removed ${removedUser?.name || "a user"} from the group`,
      messageType: "system",
      status: "sent",
      isDeleted: false,
      createdAt: Date.now(),
    })

    return { success: true }
  },
})

/**
 * Leave a group
 */
export const leaveGroup = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) throw new Error("Not authenticated")

    const conversation = await ctx.db.get(args.conversationId)
    if (!conversation || conversation.type !== "group") {
      throw new Error("Group not found")
    }

    const participant = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_user_conversation", (q) =>
        q.eq("userId", currentUser._id).eq("conversationId", args.conversationId)
      )
      .unique()

    if (!participant) throw new Error("Not a member of this group")

    // If owner is leaving, transfer ownership to next admin or oldest member
    if (participant.role === "owner") {
      const allMembers = await ctx.db
        .query("conversationParticipants")
        .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
        .collect()

      const otherMembers = allMembers.filter(m => m.userId !== currentUser._id)

      if (otherMembers.length > 0) {
        // Prefer admins, then by join date
        const nextOwner = otherMembers.find(m => m.role === "admin") || otherMembers[0]
        await ctx.db.patch(nextOwner._id, { role: "owner" })
      }
    }

    await ctx.db.delete(participant._id)

    // Update participantIds
    const updatedIds = conversation.participantIds.filter(id => id !== currentUser._id)
    await ctx.db.patch(args.conversationId, { participantIds: updatedIds })

    // System message
    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: currentUser._id,
      content: `${currentUser.name} left the group`,
      messageType: "system",
      status: "sent",
      isDeleted: false,
      createdAt: Date.now(),
    })

    // If no members left, delete the conversation
    const remaining = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect()

    if (remaining.length === 0) {
      await ctx.db.delete(args.conversationId)
    }

    return { success: true }
  },
})

/**
 * Update group info (name, description, avatar) — admin/owner only
 */
export const updateGroupInfo = mutation({
  args: {
    conversationId: v.id("conversations"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) throw new Error("Not authenticated")

    const conversation = await ctx.db.get(args.conversationId)
    if (!conversation || conversation.type !== "group") {
      throw new Error("Group not found")
    }

    // Check caller is admin/owner
    const callerParticipant = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_user_conversation", (q) =>
        q.eq("userId", currentUser._id).eq("conversationId", args.conversationId)
      )
      .unique()

    if (!callerParticipant || (callerParticipant.role !== "owner" && callerParticipant.role !== "admin")) {
      throw new Error("Only admins can update group info")
    }

    const updates: any = {}
    if (args.name !== undefined) {
      if (!args.name.trim()) throw new Error("Group name is required")
      if (args.name.length > 100) throw new Error("Group name too long (max 100 characters)")
      updates.name = args.name.trim()
    }
    if (args.description !== undefined) {
      if (args.description.length > 1000) throw new Error("Description too long (max 1000 characters)")
      updates.description = args.description.trim()
    }
    if (args.avatar !== undefined) updates.avatar = args.avatar

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.conversationId, updates)
    }

    return { success: true }
  },
})

/**
 * Promote a member to admin
 */
export const promoteToAdmin = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) throw new Error("Not authenticated")

    const conversation = await ctx.db.get(args.conversationId)
    if (!conversation || conversation.type !== "group") {
      throw new Error("Group not found")
    }

    // Only owner can promote
    const callerParticipant = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_user_conversation", (q) =>
        q.eq("userId", currentUser._id).eq("conversationId", args.conversationId)
      )
      .unique()

    if (!callerParticipant || callerParticipant.role !== "owner") {
      throw new Error("Only the group owner can promote members")
    }

    const targetParticipant = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_user_conversation", (q) =>
        q.eq("userId", args.userId).eq("conversationId", args.conversationId)
      )
      .unique()

    if (!targetParticipant) throw new Error("User is not a member")
    if (targetParticipant.role === "owner") throw new Error("Cannot change owner's role")
    if (targetParticipant.role === "admin") throw new Error("User is already an admin")

    await ctx.db.patch(targetParticipant._id, { role: "admin" })

    const promotedUser = await ctx.db.get(args.userId)
    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: currentUser._id,
      content: `${currentUser.name} promoted ${promotedUser?.name || "a user"} to admin`,
      messageType: "system",
      status: "sent",
      isDeleted: false,
      createdAt: Date.now(),
    })

    return { success: true }
  },
})

/**
 * Demote an admin to member
 */
export const demoteFromAdmin = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) throw new Error("Not authenticated")

    const conversation = await ctx.db.get(args.conversationId)
    if (!conversation || conversation.type !== "group") {
      throw new Error("Group not found")
    }

    const callerParticipant = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_user_conversation", (q) =>
        q.eq("userId", currentUser._id).eq("conversationId", args.conversationId)
      )
      .unique()

    if (!callerParticipant || callerParticipant.role !== "owner") {
      throw new Error("Only the group owner can demote admins")
    }

    const targetParticipant = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_user_conversation", (q) =>
        q.eq("userId", args.userId).eq("conversationId", args.conversationId)
      )
      .unique()

    if (!targetParticipant) throw new Error("User is not a member")
    if (targetParticipant.role !== "admin") throw new Error("User is not an admin")

    await ctx.db.patch(targetParticipant._id, { role: "member" })

    return { success: true }
  },
})

/**
 * Pin/unpin a message (admin/owner only)
 */
export const pinMessage = mutation({
  args: {
    messageId: v.id("messages"),
    isPinned: v.boolean(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) throw new Error("Not authenticated")

    const message = await ctx.db.get(args.messageId)
    if (!message) throw new Error("Message not found")

    const conversation = await ctx.db.get(message.conversationId)
    if (!conversation || conversation.type !== "group") {
      throw new Error("Can only pin messages in groups")
    }

    const callerParticipant = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_user_conversation", (q) =>
        q.eq("userId", currentUser._id).eq("conversationId", message.conversationId)
      )
      .unique()

    if (!callerParticipant || (callerParticipant.role !== "owner" && callerParticipant.role !== "admin")) {
      throw new Error("Only admins can pin messages")
    }

    await ctx.db.patch(args.messageId, { isPinned: args.isPinned })
    return { success: true }
  },
})

/**
 * Get pinned messages in a group
 */
export const getPinnedMessages = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)
    if (!currentUser) return []

    // Verify membership
    const participant = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_user_conversation", (q) =>
        q.eq("userId", currentUser._id).eq("conversationId", args.conversationId)
      )
      .unique()

    if (!participant) return []

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect()

    const pinnedMessages = messages.filter(m => m.isPinned && !m.isDeleted)

    // Attach sender info
    const results = []
    for (const msg of pinnedMessages) {
      const sender = await ctx.db.get(msg.senderId)
      results.push({
        ...msg,
        senderName: sender?.name || "Unknown",
        senderAvatar: sender?.profilePicture,
      })
    }

    return results
  },
})
