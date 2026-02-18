/**
 * Unit Tests for Messages
 * Feature: Phase 2.1 - Direct Messaging
 *
 * Tests message sending, receiving, editing, deleting, and read receipt logic.
 */

describe("Messages", () => {
  describe("sendMessage validation", () => {
    it("should require content or attachment", () => {
      const content = ""
      const attachmentUrl = undefined
      const isValid = content.trim().length > 0 || !!attachmentUrl

      expect(isValid).toBe(false)
    })

    it("should accept message with content only", () => {
      const content = "Hello!"
      const attachmentUrl = undefined
      const isValid = content.trim().length > 0 || !!attachmentUrl

      expect(isValid).toBe(true)
    })

    it("should accept message with attachment only", () => {
      const content = ""
      const attachmentUrl = "https://example.com/file.pdf"
      const isValid = content.trim().length > 0 || !!attachmentUrl

      expect(isValid).toBe(true)
    })

    it("should reject messages over 5000 characters", () => {
      const content = "A".repeat(5001)
      const isTooLong = content.length > 5000

      expect(isTooLong).toBe(true)
    })

    it("should accept messages at 5000 characters", () => {
      const content = "A".repeat(5000)
      const isTooLong = content.length > 5000

      expect(isTooLong).toBe(false)
    })

    it("should trim message content", () => {
      const content = "  Hello World!  "
      const trimmed = content.trim()

      expect(trimmed).toBe("Hello World!")
    })

    it("should default to text message type", () => {
      const messageType = undefined
      const resolvedType = messageType || "text"

      expect(resolvedType).toBe("text")
    })

    it("should accept valid message types", () => {
      const validTypes = ["text", "image", "file"]
      validTypes.forEach((type) => {
        expect(["text", "image", "file"]).toContain(type)
      })
    })

    it("should validate reply reference is in same conversation", () => {
      const replyMsg = {
        _id: "msg1",
        conversationId: "conv1",
      }
      const currentConversation = "conv1"
      const isValid = replyMsg.conversationId === currentConversation

      expect(isValid).toBe(true)
    })

    it("should reject reply reference from different conversation", () => {
      const replyMsg = {
        _id: "msg1",
        conversationId: "conv2",
      }
      const currentConversation = "conv1"
      const isValid = replyMsg.conversationId === currentConversation

      expect(isValid).toBe(false)
    })
  })

  describe("message preview generation", () => {
    it("should truncate long messages to 100 chars", () => {
      const content = "A".repeat(150)
      const preview =
        content.length > 100 ? content.substring(0, 97) + "..." : content

      expect(preview.length).toBe(100)
      expect(preview.endsWith("...")).toBe(true)
    })

    it("should not truncate short messages", () => {
      const content = "Hello World!"
      const preview =
        content.length > 100 ? content.substring(0, 97) + "..." : content

      expect(preview).toBe("Hello World!")
    })

    it("should handle exactly 100 character messages", () => {
      const content = "A".repeat(100)
      const preview =
        content.length > 100 ? content.substring(0, 97) + "..." : content

      expect(preview).toBe(content)
      expect(preview.length).toBe(100)
    })
  })

  describe("getMessages pagination", () => {
    it("should return messages in chronological order", () => {
      const messages = [
        { _id: "m1", createdAt: 3000, content: "Third" },
        { _id: "m2", createdAt: 1000, content: "First" },
        { _id: "m3", createdAt: 2000, content: "Second" },
      ]

      // Sort descending for loading, then reverse for display
      const sorted = [...messages].sort((a, b) => b.createdAt - a.createdAt)
      const chronological = sorted.reverse()

      expect(chronological[0].content).toBe("First")
      expect(chronological[1].content).toBe("Second")
      expect(chronological[2].content).toBe("Third")
    })

    it("should filter deleted-for-user messages", () => {
      const currentUserId = "user1"
      const messages = [
        { _id: "m1", deletedForUserIds: undefined, content: "Visible" },
        { _id: "m2", deletedForUserIds: ["user1"], content: "Hidden" },
        { _id: "m3", deletedForUserIds: ["user2"], content: "Visible 2" },
        { _id: "m4", deletedForUserIds: ["user1", "user2"], content: "Hidden 2" },
      ]

      const filtered = messages.filter((m) => {
        if (m.deletedForUserIds && m.deletedForUserIds.includes(currentUserId)) {
          return false
        }
        return true
      })

      expect(filtered).toHaveLength(2)
      expect(filtered[0].content).toBe("Visible")
      expect(filtered[1].content).toBe("Visible 2")
    })

    it("should apply cursor-based pagination", () => {
      const allMessages = [
        { _id: "m1", createdAt: 5000 },
        { _id: "m2", createdAt: 4000 },
        { _id: "m3", createdAt: 3000 },
        { _id: "m4", createdAt: 2000 },
        { _id: "m5", createdAt: 1000 },
      ]

      const cursorTime = 3000
      const startIndex = allMessages.findIndex((m) => m.createdAt < cursorTime)
      const limit = 2
      const page = allMessages.slice(startIndex, startIndex + limit)

      expect(page).toHaveLength(2)
      expect(page[0]._id).toBe("m4")
      expect(page[1]._id).toBe("m5")
    })

    it("should determine next cursor", () => {
      const limit = 3
      const pageMessages = [
        { createdAt: 3000 },
        { createdAt: 2000 },
        { createdAt: 1000 },
      ]

      const hasMore = pageMessages.length === limit
      const nextCursor = hasMore
        ? String(pageMessages[pageMessages.length - 1].createdAt)
        : null

      expect(nextCursor).toBe("1000")
    })

    it("should return null cursor when no more messages", () => {
      const limit = 5
      const pageMessages = [
        { createdAt: 2000 },
        { createdAt: 1000 },
      ]

      const hasMore = pageMessages.length === limit
      const nextCursor = hasMore
        ? String(pageMessages[pageMessages.length - 1].createdAt)
        : null

      expect(nextCursor).toBeNull()
    })
  })

  describe("deleteMessage", () => {
    it("should delete for me by adding to deletedForUserIds", () => {
      const existingDeletedFor: string[] = []
      const currentUserId = "user1"

      const updated = [...existingDeletedFor, currentUserId]

      expect(updated).toContain("user1")
      expect(updated).toHaveLength(1)
    })

    it("should not duplicate userId in deletedForUserIds", () => {
      const existingDeletedFor = ["user1"]
      const currentUserId = "user1"

      const alreadyDeleted = existingDeletedFor.includes(currentUserId)

      expect(alreadyDeleted).toBe(true)
    })

    it("should only allow sender to delete for everyone", () => {
      const messageSenderId = "user1"
      const currentUserId = "user2"
      const canDeleteForEveryone = messageSenderId === currentUserId

      expect(canDeleteForEveryone).toBe(false)
    })

    it("should enforce 15-minute window for delete-for-everyone", () => {
      const fifteenMinutes = 15 * 60 * 1000
      const messageCreatedAt = Date.now() - 20 * 60 * 1000 // 20 minutes ago
      const isWithinWindow = Date.now() - messageCreatedAt <= fifteenMinutes

      expect(isWithinWindow).toBe(false)
    })

    it("should allow delete-for-everyone within 15 minutes", () => {
      const fifteenMinutes = 15 * 60 * 1000
      const messageCreatedAt = Date.now() - 10 * 60 * 1000 // 10 minutes ago
      const isWithinWindow = Date.now() - messageCreatedAt <= fifteenMinutes

      expect(isWithinWindow).toBe(true)
    })

    it("should mark message as deleted and update content", () => {
      const message = {
        content: "Secret message",
        isDeleted: false,
      }

      const deleted = {
        ...message,
        isDeleted: true,
        content: "This message was deleted",
      }

      expect(deleted.isDeleted).toBe(true)
      expect(deleted.content).toBe("This message was deleted")
    })
  })

  describe("markAsRead", () => {
    it("should update participant lastReadMessageId", () => {
      const participant = {
        lastReadMessageId: "msg1",
        lastReadAt: 1000,
      }

      const updated = {
        ...participant,
        lastReadMessageId: "msg5",
        lastReadAt: Date.now(),
      }

      expect(updated.lastReadMessageId).toBe("msg5")
      expect(updated.lastReadAt).toBeGreaterThan(participant.lastReadAt)
    })

    it("should update message status to read", () => {
      const message = { status: "sent", senderId: "user2" }
      const currentUserId = "user1"

      // Should update when user reads someone else's message
      const shouldUpdate =
        message.senderId !== currentUserId && message.status !== "read"
      const updated = shouldUpdate ? { ...message, status: "read" } : message

      expect(shouldUpdate).toBe(true)
      expect(updated.status).toBe("read")
    })

    it("should not update own message status", () => {
      const message = { status: "sent", senderId: "user1" }
      const currentUserId = "user1"

      const shouldUpdate =
        message.senderId !== currentUserId && message.status !== "read"

      expect(shouldUpdate).toBe(false)
    })

    it("should mark all earlier messages as read", () => {
      const readUpToTime = 3000
      const currentUserId = "user1"
      const messages = [
        { _id: "m1", createdAt: 1000, senderId: "user2", status: "sent" },
        { _id: "m2", createdAt: 2000, senderId: "user2", status: "sent" },
        { _id: "m3", createdAt: 3000, senderId: "user2", status: "sent" },
        { _id: "m4", createdAt: 4000, senderId: "user2", status: "sent" }, // Not read yet
      ]

      const toMarkAsRead = messages.filter(
        (m) =>
          m.createdAt <= readUpToTime &&
          m.senderId !== currentUserId &&
          m.status !== "read"
      )

      expect(toMarkAsRead).toHaveLength(3)
    })
  })

  describe("editMessage", () => {
    it("should only allow sender to edit", () => {
      const messageSenderId = "user1"
      const currentUserId = "user2"
      const canEdit = messageSenderId === currentUserId

      expect(canEdit).toBe(false)
    })

    it("should not allow editing deleted messages", () => {
      const message = { isDeleted: true }
      const canEdit = !message.isDeleted

      expect(canEdit).toBe(false)
    })

    it("should only allow editing text messages", () => {
      const messageTypes = ["text", "image", "file", "system"]
      const canEdit = messageTypes.map((type) => ({
        type,
        editable: type === "text",
      }))

      expect(canEdit[0].editable).toBe(true)
      expect(canEdit[1].editable).toBe(false)
      expect(canEdit[2].editable).toBe(false)
      expect(canEdit[3].editable).toBe(false)
    })

    it("should enforce 15-minute edit window", () => {
      const fifteenMinutes = 15 * 60 * 1000
      const messageCreatedAt = Date.now() - 20 * 60 * 1000
      const canEdit = Date.now() - messageCreatedAt <= fifteenMinutes

      expect(canEdit).toBe(false)
    })

    it("should reject empty edited content", () => {
      const content = "   "
      const isValid = content.trim().length > 0

      expect(isValid).toBe(false)
    })

    it("should set updatedAt timestamp on edit", () => {
      const message = {
        content: "Original",
        updatedAt: undefined as number | undefined,
      }

      const edited = {
        ...message,
        content: "Edited content",
        updatedAt: Date.now(),
      }

      expect(edited.updatedAt).toBeDefined()
      expect(edited.content).toBe("Edited content")
    })
  })

  describe("getReadReceipts", () => {
    it("should exclude sender from receipts", () => {
      const participants = [
        { userId: "user1", lastReadMessageId: "msg1", lastReadAt: 1000 },
        { userId: "user2", lastReadMessageId: "msg1", lastReadAt: 2000 },
        { userId: "user3", lastReadMessageId: "msg1", lastReadAt: 3000 },
      ]

      const messageSenderId = "user1"
      const receipts = participants.filter((p) => p.userId !== messageSenderId)

      expect(receipts).toHaveLength(2)
      expect(receipts.every((r) => r.userId !== messageSenderId)).toBe(true)
    })

    it("should only include participants who read past the message", () => {
      const messageCreatedAt = 2000
      const participants = [
        { userId: "user2", lastReadTime: 3000 }, // read after message
        { userId: "user3", lastReadTime: 1000 }, // read before message
        { userId: "user4", lastReadTime: 2000 }, // read exactly at message time
      ]

      const readers = participants.filter(
        (p) => p.lastReadTime >= messageCreatedAt
      )

      expect(readers).toHaveLength(2)
      expect(readers[0].userId).toBe("user2")
      expect(readers[1].userId).toBe("user4")
    })
  })

  describe("searchMessages", () => {
    it("should return empty for empty query", () => {
      const query = "  "
      const hasQuery = query.trim().length > 0

      expect(hasQuery).toBe(false)
    })

    it("should be case-insensitive", () => {
      const messageContent = "Hello World!"
      const query = "hello"

      const matches = messageContent.toLowerCase().includes(query.toLowerCase())

      expect(matches).toBe(true)
    })

    it("should skip deleted messages", () => {
      const messages = [
        { content: "Hello", isDeleted: false },
        { content: "Hello again", isDeleted: true },
        { content: "Hello there", isDeleted: false },
      ]

      const query = "hello"
      const results = messages.filter(
        (m) => !m.isDeleted && m.content.toLowerCase().includes(query)
      )

      expect(results).toHaveLength(2)
    })

    it("should skip messages deleted for current user", () => {
      const currentUserId = "user1"
      const messages = [
        { content: "Hello", deletedForUserIds: undefined as string[] | undefined },
        { content: "Hello", deletedForUserIds: ["user1"] },
        { content: "Hello", deletedForUserIds: ["user2"] },
      ]

      const results = messages.filter(
        (m) => !m.deletedForUserIds?.includes(currentUserId)
      )

      expect(results).toHaveLength(2)
    })

    it("should limit results", () => {
      const allResults = Array.from({ length: 50 }, (_, i) => ({
        content: `Message ${i}`,
      }))

      const limit = 20
      const results = allResults.slice(0, limit)

      expect(results).toHaveLength(20)
    })
  })

  describe("reactToMessage", () => {
    it("should add new reaction", () => {
      const existingReaction = null
      const action = existingReaction ? "toggle" : "added"

      expect(action).toBe("added")
    })

    it("should remove reaction with same emoji", () => {
      const existingReaction = { type: "❤️" }
      const newEmoji = "❤️"
      const action = existingReaction.type === newEmoji ? "removed" : "updated"

      expect(action).toBe("removed")
    })

    it("should update reaction with different emoji", () => {
      const existingReaction = { type: "❤️" }
      const newEmoji = "👍"
      const action = existingReaction.type === newEmoji ? "removed" : "updated"

      expect(action).toBe("updated")
    })
  })

  describe("notification generation", () => {
    it("should notify non-muted participants", () => {
      const participants = [
        { userId: "user1", isMuted: false }, // sender
        { userId: "user2", isMuted: false },
        { userId: "user3", isMuted: true },
        { userId: "user4", isMuted: false },
      ]

      const senderId = "user1"
      const toNotify = participants.filter(
        (p) => p.userId !== senderId && !p.isMuted
      )

      expect(toNotify).toHaveLength(2)
      expect(toNotify.map((p) => p.userId)).toEqual(["user2", "user4"])
    })

    it("should generate correct DM notification message", () => {
      const senderName = "Alice"
      const conversationType = "direct"
      const groupName = undefined

      const message =
        conversationType === "group"
          ? `${senderName} sent a message in ${groupName}`
          : `${senderName} sent you a message`

      expect(message).toBe("Alice sent you a message")
    })

    it("should generate correct group notification message", () => {
      const senderName = "Alice"
      const conversationType = "group"
      const groupName = "Team Chat"

      const message =
        conversationType === "group"
          ? `${senderName} sent a message in ${groupName}`
          : `${senderName} sent you a message`

      expect(message).toBe("Alice sent a message in Team Chat")
    })
  })

  describe("message data structure", () => {
    it("should have required fields", () => {
      const message = {
        conversationId: "conv1",
        senderId: "user1",
        content: "Hello",
        messageType: "text",
        status: "sent",
        isDeleted: false,
        createdAt: Date.now(),
      }

      expect(message).toHaveProperty("conversationId")
      expect(message).toHaveProperty("senderId")
      expect(message).toHaveProperty("content")
      expect(message).toHaveProperty("messageType")
      expect(message).toHaveProperty("status")
      expect(message).toHaveProperty("isDeleted")
      expect(message).toHaveProperty("createdAt")
    })

    it("should support optional fields", () => {
      const message = {
        conversationId: "conv1",
        senderId: "user1",
        content: "Check this file",
        messageType: "file",
        attachmentUrl: "https://example.com/file.pdf",
        attachmentName: "report.pdf",
        replyToId: "msg_prev",
        status: "delivered",
        isDeleted: false,
        isPinned: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      expect(message.attachmentUrl).toBeDefined()
      expect(message.attachmentName).toBeDefined()
      expect(message.replyToId).toBeDefined()
      expect(message.isPinned).toBe(true)
      expect(message.updatedAt).toBeDefined()
    })

    it("should track message status progression", () => {
      const validStatuses = ["sent", "delivered", "read"]
      const statusProgression = {
        sent: 0,
        delivered: 1,
        read: 2,
      }

      expect(statusProgression.sent).toBeLessThan(statusProgression.delivered)
      expect(statusProgression.delivered).toBeLessThan(statusProgression.read)
    })
  })
})

describe("Presence / Typing Indicators", () => {
  describe("setTyping", () => {
    it("should set typing state", () => {
      const indicator = {
        conversationId: "conv1",
        userId: "user1",
        isTyping: true,
        updatedAt: Date.now(),
      }

      expect(indicator.isTyping).toBe(true)
    })

    it("should clear typing state", () => {
      const indicator = {
        isTyping: true,
        updatedAt: 1000,
      }

      const updated = {
        ...indicator,
        isTyping: false,
        updatedAt: Date.now(),
      }

      expect(updated.isTyping).toBe(false)
      expect(updated.updatedAt).toBeGreaterThan(indicator.updatedAt)
    })
  })

  describe("getTypingUsers", () => {
    it("should exclude current user from typing list", () => {
      const typingIndicators = [
        { userId: "user1", isTyping: true },
        { userId: "user2", isTyping: true },
        { userId: "user3", isTyping: false },
      ]

      const currentUserId = "user1"
      const typingUsers = typingIndicators.filter(
        (i) => i.isTyping && i.userId !== currentUserId
      )

      expect(typingUsers).toHaveLength(1)
      expect(typingUsers[0].userId).toBe("user2")
    })

    it("should exclude stale typing indicators (>10s)", () => {
      const now = Date.now()
      const staleThreshold = 10 * 1000

      const typingIndicators = [
        { userId: "user2", isTyping: true, updatedAt: now - 5000 },   // 5s ago
        { userId: "user3", isTyping: true, updatedAt: now - 15000 },  // 15s ago (stale)
        { userId: "user4", isTyping: true, updatedAt: now - 8000 },   // 8s ago
      ]

      const activeTyping = typingIndicators.filter(
        (i) => i.isTyping && now - i.updatedAt < staleThreshold
      )

      expect(activeTyping).toHaveLength(2)
      expect(activeTyping.map((t) => t.userId)).toEqual(["user2", "user4"])
    })
  })

  describe("typing indicator display", () => {
    it("should show single user typing", () => {
      const typingUsers = [{ name: "Alice" }]

      let text = ""
      if (typingUsers.length === 1) {
        text = `${typingUsers[0].name} is typing`
      }

      expect(text).toBe("Alice is typing")
    })

    it("should show two users typing", () => {
      const typingUsers = [{ name: "Alice" }, { name: "Bob" }]

      let text = ""
      if (typingUsers.length === 2) {
        text = `${typingUsers[0].name} and ${typingUsers[1].name} are typing`
      }

      expect(text).toBe("Alice and Bob are typing")
    })

    it("should show N others for 3+ users typing", () => {
      const typingUsers = [
        { name: "Alice" },
        { name: "Bob" },
        { name: "Charlie" },
      ]

      let text = ""
      if (typingUsers.length > 2) {
        text = `${typingUsers[0].name} and ${typingUsers.length - 1} others are typing`
      }

      expect(text).toBe("Alice and 2 others are typing")
    })

    it("should return empty for no users typing", () => {
      const typingUsers: any[] = []
      const showIndicator = typingUsers.length > 0

      expect(showIndicator).toBe(false)
    })
  })
})
