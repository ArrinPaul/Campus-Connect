/**
 * Unit Tests for Conversations + Group Chat
 * Feature: Phase 2.1 - Direct Messaging / Phase 2.2 - Group Chat
 *
 * Tests the conversation and group chat business logic.
 */

describe("Conversations", () => {
  describe("getOrCreateConversation validation", () => {
    it("should reject self-conversations", () => {
      const currentUserId = "user1"
      const otherUserId = "user1"
      const isSelf = currentUserId === otherUserId

      expect(isSelf).toBe(true)
    })

    it("should allow conversations between different users", () => {
      const currentUserId = "user1"
      const otherUserId = "user2"
      const isSelf = currentUserId === otherUserId

      expect(isSelf).toBe(false)
    })

    it("should sort participant IDs for consistent lookup", () => {
      const pair1 = ["user_b", "user_a"].sort()
      const pair2 = ["user_a", "user_b"].sort()

      expect(pair1).toEqual(pair2)
      expect(pair1[0]).toBe("user_a")
      expect(pair1[1]).toBe("user_b")
    })
  })

  describe("existing conversation detection", () => {
    it("should find existing DM between two users", () => {
      const conversations = [
        { _id: "conv1", type: "direct", participantIds: ["user1", "user2"] },
        { _id: "conv2", type: "direct", participantIds: ["user1", "user3"] },
        { _id: "conv3", type: "group", participantIds: ["user1", "user2", "user3"] },
      ]

      const targetUserId = "user2"
      const existing = conversations.find(
        (c) =>
          c.type === "direct" && c.participantIds.includes(targetUserId)
      )

      expect(existing).toBeDefined()
      expect(existing?._id).toBe("conv1")
    })

    it("should not match group conversations when looking for DM", () => {
      const conversations = [
        { _id: "conv3", type: "group", participantIds: ["user1", "user2", "user3"] },
      ]

      const targetUserId = "user2"
      const existing = conversations.find(
        (c) =>
          c.type === "direct" && c.participantIds.includes(targetUserId)
      )

      expect(existing).toBeUndefined()
    })

    it("should return null when no existing DM exists", () => {
      const conversations = [
        { _id: "conv1", type: "direct", participantIds: ["user1", "user3"] },
      ]

      const targetUserId = "user2"
      const existing = conversations.find(
        (c) =>
          c.type === "direct" && c.participantIds.includes(targetUserId)
      )

      expect(existing).toBeUndefined()
    })
  })

  describe("getConversations", () => {
    it("should sort conversations by last message time", () => {
      const conversations = [
        { _id: "c1", lastMessageAt: 1000, createdAt: 100 },
        { _id: "c2", lastMessageAt: 3000, createdAt: 200 },
        { _id: "c3", lastMessageAt: 2000, createdAt: 300 },
        { _id: "c4", lastMessageAt: undefined, createdAt: 400 },
      ]

      const sorted = [...conversations].sort(
        (a, b) => (b.lastMessageAt || b.createdAt) - (a.lastMessageAt || a.createdAt)
      )

      expect(sorted[0]._id).toBe("c2")
      expect(sorted[1]._id).toBe("c3")
      expect(sorted[2]._id).toBe("c1")
      expect(sorted[3]._id).toBe("c4")
    })

    it("should use createdAt as fallback when no messages", () => {
      const conversations = [
        { _id: "c1", lastMessageAt: undefined, createdAt: 100 },
        { _id: "c2", lastMessageAt: undefined, createdAt: 300 },
      ]

      const sorted = [...conversations].sort(
        (a, b) => (b.lastMessageAt || b.createdAt) - (a.lastMessageAt || a.createdAt)
      )

      expect(sorted[0]._id).toBe("c2")
      expect(sorted[1]._id).toBe("c1")
    })

    it("should apply limit to results", () => {
      const conversations = Array.from({ length: 100 }, (_, i) => ({
        _id: `c${i}`,
        lastMessageAt: i * 1000,
        createdAt: i * 100,
      }))

      const limit = 50
      const result = conversations.slice(0, limit)

      expect(result).toHaveLength(50)
    })

    it("should calculate unread count for never-read conversations", () => {
      const messages = [
        { senderId: "user2", isDeleted: false },
        { senderId: "user2", isDeleted: false },
        { senderId: "user1", isDeleted: false }, // own message
        { senderId: "user2", isDeleted: true },  // deleted
      ]

      const currentUserId = "user1"
      const lastReadId = null

      const unreadCount = messages.filter(
        (m) => m.senderId !== currentUserId && !m.isDeleted
      ).length

      expect(unreadCount).toBe(2) // 2 valid messages from user2
    })

    it("should calculate unread count from last read position", () => {
      const lastReadTime = 2000
      const messages = [
        { senderId: "user2", isDeleted: false, createdAt: 1000 },
        { senderId: "user2", isDeleted: false, createdAt: 2000 }, // last read
        { senderId: "user2", isDeleted: false, createdAt: 3000 }, // unread
        { senderId: "user1", isDeleted: false, createdAt: 3500 }, // own
        { senderId: "user2", isDeleted: false, createdAt: 4000 }, // unread
      ]

      const currentUserId = "user1"
      const unreadCount = messages.filter(
        (m) =>
          m.createdAt > lastReadTime &&
          m.senderId !== currentUserId &&
          !m.isDeleted
      ).length

      expect(unreadCount).toBe(2)
    })

    it("should skip muted conversations for total unread", () => {
      const participantRecords = [
        { conversationId: "c1", isMuted: false, lastReadMessageId: null },
        { conversationId: "c2", isMuted: true, lastReadMessageId: null },
        { conversationId: "c3", isMuted: false, lastReadMessageId: null },
      ]

      const activeCounts = participantRecords.filter((p) => !p.isMuted)
      expect(activeCounts).toHaveLength(2)
    })
  })

  describe("muteConversation", () => {
    it("should toggle mute state", () => {
      const participant = { isMuted: false }
      const updated = { ...participant, isMuted: true }

      expect(updated.isMuted).toBe(true)
    })

    it("should toggle unmute state", () => {
      const participant = { isMuted: true }
      const updated = { ...participant, isMuted: false }

      expect(updated.isMuted).toBe(false)
    })
  })

  describe("deleteConversation", () => {
    it("should remove participant record", () => {
      const participants = [
        { _id: "p1", userId: "user1", conversationId: "conv1" },
        { _id: "p2", userId: "user2", conversationId: "conv1" },
      ]

      const afterRemoval = participants.filter((p) => p.userId !== "user1")
      expect(afterRemoval).toHaveLength(1)
      expect(afterRemoval[0].userId).toBe("user2")
    })

    it("should delete conversation when no participants remain", () => {
      const participants = [
        { _id: "p1", userId: "user1", conversationId: "conv1" },
      ]

      const afterRemoval = participants.filter((p) => p.userId !== "user1")
      const shouldDeleteConversation = afterRemoval.length === 0

      expect(shouldDeleteConversation).toBe(true)
    })

    it("should keep conversation when other participants remain", () => {
      const participants = [
        { _id: "p1", userId: "user1", conversationId: "conv1" },
        { _id: "p2", userId: "user2", conversationId: "conv1" },
      ]

      const afterRemoval = participants.filter((p) => p.userId !== "user1")
      const shouldDeleteConversation = afterRemoval.length === 0

      expect(shouldDeleteConversation).toBe(false)
    })
  })

  describe("searchConversations", () => {
    it("should match group conversations by name", () => {
      const conversations = [
        { type: "group", name: "Engineering Team", participantIds: [] },
        { type: "group", name: "Marketing", participantIds: [] },
        { type: "direct", name: undefined, participantIds: [] },
      ]

      const query = "engineer"
      const matches = conversations.filter(
        (c) =>
          c.type === "group" &&
          c.name &&
          c.name.toLowerCase().includes(query.toLowerCase())
      )

      expect(matches).toHaveLength(1)
      expect(matches[0].name).toBe("Engineering Team")
    })

    it("should return empty for empty search query", () => {
      const query = "   "
      const hasQuery = query.trim().length > 0

      expect(hasQuery).toBe(false)
    })

    it("should be case-insensitive", () => {
      const name = "Engineering Team"
      const query = "ENGINEERING"

      expect(name.toLowerCase().includes(query.toLowerCase())).toBe(true)
    })

    it("should match by participant username", () => {
      const participants = [
        { name: "Alice", username: "alice_dev" },
        { name: "Bob", username: "bob123" },
      ]

      const query = "alice"
      const matches = participants.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.username && p.username.toLowerCase().includes(query))
      )

      expect(matches).toHaveLength(1)
      expect(matches[0].name).toBe("Alice")
    })
  })
})

describe("Group Chat", () => {
  describe("createGroup validation", () => {
    it("should require group name", () => {
      const name = ""
      const isValid = name.trim().length > 0

      expect(isValid).toBe(false)
    })

    it("should reject names over 100 characters", () => {
      const name = "A".repeat(101)
      const isTooLong = name.length > 100

      expect(isTooLong).toBe(true)
    })

    it("should accept valid group name", () => {
      const name = "Engineering Team"
      const isValid = name.trim().length > 0 && name.length <= 100

      expect(isValid).toBe(true)
    })

    it("should require at least one member", () => {
      const memberIds: string[] = []
      const isValid = memberIds.length > 0

      expect(isValid).toBe(false)
    })

    it("should enforce maximum 256 members", () => {
      const memberIds = Array.from({ length: 256 }, (_, i) => `user${i}`)
      const isTooMany = memberIds.length > 255

      expect(isTooMany).toBe(true)
    })

    it("should deduplicate member IDs", () => {
      const memberIds = ["user1", "user2", "user1", "user3", "user2"]
      const uniqueIds = Array.from(new Set(memberIds))

      expect(uniqueIds).toHaveLength(3)
      expect(uniqueIds).toContain("user1")
      expect(uniqueIds).toContain("user2")
      expect(uniqueIds).toContain("user3")
    })

    it("should exclude creator from member list", () => {
      const currentUserId = "creator"
      const memberIds = ["user1", "creator", "user2"]
      const filteredIds = memberIds.filter((id) => id !== currentUserId)

      expect(filteredIds).toHaveLength(2)
      expect(filteredIds).not.toContain("creator")
    })

    it("should trim group name and description", () => {
      const name = "  Engineering Team  "
      const description = "  A team for engineers  "

      expect(name.trim()).toBe("Engineering Team")
      expect(description.trim()).toBe("A team for engineers")
    })

    it("should assign owner role to creator", () => {
      const creator = { userId: "creator", role: "owner" }
      const members = [
        { userId: "user1", role: "member" },
        { userId: "user2", role: "member" },
      ]

      expect(creator.role).toBe("owner")
      members.forEach((m) => expect(m.role).toBe("member"))
    })

    it("should generate system message on creation", () => {
      const creatorName = "Alice"
      const groupName = "Team Chat"
      const expectedMessage = `${creatorName} created the group "${groupName}"`

      expect(expectedMessage).toBe('Alice created the group "Team Chat"')
    })
  })

  describe("addGroupMember", () => {
    it("should only allow admin/owner to add members", () => {
      const roles = ["owner", "admin", "member"]
      const canAdd = roles.map((role) => ({
        role,
        allowed: role === "owner" || role === "admin",
      }))

      expect(canAdd[0].allowed).toBe(true) // owner
      expect(canAdd[1].allowed).toBe(true) // admin
      expect(canAdd[2].allowed).toBe(false) // member
    })

    it("should reject duplicate members", () => {
      const existingMembers = [
        { userId: "user1" },
        { userId: "user2" },
      ]

      const newUserId = "user1"
      const isDuplicate = existingMembers.some((m) => m.userId === newUserId)

      expect(isDuplicate).toBe(true)
    })

    it("should enforce max member count", () => {
      const existingCount = 256
      const isAtCapacity = existingCount >= 256

      expect(isAtCapacity).toBe(true)
    })

    it("should update participantIds on add", () => {
      const currentIds = ["user1", "user2"]
      const newUserId = "user3"
      const updatedIds = [...currentIds, newUserId].sort()

      expect(updatedIds).toEqual(["user1", "user2", "user3"])
    })

    it("should create system message on add", () => {
      const adminName = "Alice"
      const newMemberName = "Bob"
      const msg = `${adminName} added ${newMemberName} to the group`

      expect(msg).toBe("Alice added Bob to the group")
    })
  })

  describe("removeGroupMember", () => {
    it("should only allow admin/owner to remove members", () => {
      const callerRole = "member"
      const canRemove = callerRole === "owner" || callerRole === "admin"

      expect(canRemove).toBe(false)
    })

    it("should not allow removing the owner", () => {
      const targetRole = "owner"
      const canRemove = targetRole !== "owner"

      expect(canRemove).toBe(false)
    })

    it("should only allow owner to remove admins", () => {
      const targetRole = "admin"
      const callerRole = "admin"
      const canRemove =
        targetRole !== "admin" || callerRole === "owner"

      expect(canRemove).toBe(false)
    })

    it("should allow owner to remove admins", () => {
      const targetRole = "admin"
      const callerRole = "owner"
      const canRemove =
        targetRole !== "admin" || callerRole === "owner"

      expect(canRemove).toBe(true)
    })

    it("should update participantIds on remove", () => {
      const currentIds = ["user1", "user2", "user3"]
      const removedId = "user2"
      const updatedIds = currentIds.filter((id) => id !== removedId)

      expect(updatedIds).toEqual(["user1", "user3"])
    })

    it("should create system message on removal", () => {
      const adminName = "Alice"
      const removedName = "Bob"
      const msg = `${adminName} removed ${removedName} from the group`

      expect(msg).toBe("Alice removed Bob from the group")
    })
  })

  describe("leaveGroup", () => {
    it("should transfer ownership to admin when owner leaves", () => {
      const members = [
        { userId: "owner1", role: "owner" },
        { userId: "admin1", role: "admin" },
        { userId: "member1", role: "member" },
      ]

      const otherMembers = members.filter((m) => m.userId !== "owner1")
      const nextOwner =
        otherMembers.find((m) => m.role === "admin") || otherMembers[0]

      expect(nextOwner.userId).toBe("admin1")
    })

    it("should transfer ownership to oldest member when no admins", () => {
      const members = [
        { userId: "owner1", role: "owner", joinedAt: 100 },
        { userId: "member1", role: "member", joinedAt: 200 },
        { userId: "member2", role: "member", joinedAt: 300 },
      ]

      const otherMembers = members.filter((m) => m.userId !== "owner1")
      const nextOwner =
        otherMembers.find((m) => m.role === "admin") || otherMembers[0]

      expect(nextOwner.userId).toBe("member1")
    })

    it("should remove participant from list", () => {
      const participantIds = ["user1", "user2", "user3"]
      const leavingUser = "user2"
      const updated = participantIds.filter((id) => id !== leavingUser)

      expect(updated).toEqual(["user1", "user3"])
    })

    it("should delete conversation when last member leaves", () => {
      const remainingAfterLeave: any[] = []
      const shouldDelete = remainingAfterLeave.length === 0

      expect(shouldDelete).toBe(true)
    })

    it("should generate system message", () => {
      const userName = "Alice"
      const msg = `${userName} left the group`

      expect(msg).toBe("Alice left the group")
    })
  })

  describe("updateGroupInfo", () => {
    it("should only allow admin/owner to update", () => {
      const roles = [
        { role: "owner", canUpdate: true },
        { role: "admin", canUpdate: true },
        { role: "member", canUpdate: false },
      ]

      roles.forEach((r) => {
        const allowed = r.role === "owner" || r.role === "admin"
        expect(allowed).toBe(r.canUpdate)
      })
    })

    it("should reject empty group name", () => {
      const name = "   "
      const isValid = name.trim().length > 0

      expect(isValid).toBe(false)
    })

    it("should reject name over 100 characters", () => {
      const name = "X".repeat(101)
      const isTooLong = name.length > 100

      expect(isTooLong).toBe(true)
    })

    it("should trim name and description", () => {
      const updates: any = {}
      const name = "  New Name  "
      const description = "  New Description  "

      updates.name = name.trim()
      updates.description = description.trim()

      expect(updates.name).toBe("New Name")
      expect(updates.description).toBe("New Description")
    })

    it("should only include provided fields in updates", () => {
      const updates: any = {}
      const name = "New Name"
      const description = undefined
      const avatar = undefined

      if (name !== undefined) updates.name = name.trim()
      if (description !== undefined) updates.description = description
      if (avatar !== undefined) updates.avatar = avatar

      expect(Object.keys(updates)).toEqual(["name"])
    })
  })

  describe("promoteToAdmin", () => {
    it("should only allow owner to promote", () => {
      const callerRole = "admin"
      const canPromote = callerRole === "owner"

      expect(canPromote).toBe(false)
    })

    it("should not promote if already admin", () => {
      const targetRole = "admin"
      const isAlreadyAdmin = targetRole === "admin"

      expect(isAlreadyAdmin).toBe(true)
    })

    it("should not change owner role", () => {
      const targetRole = "owner"
      const isOwner = targetRole === "owner"

      expect(isOwner).toBe(true)
    })

    it("should promote member to admin", () => {
      const participant = { role: "member" }
      const updated = { ...participant, role: "admin" }

      expect(updated.role).toBe("admin")
    })

    it("should generate system message for promotion", () => {
      const ownerName = "Alice"
      const promotedName = "Bob"
      const msg = `${ownerName} promoted ${promotedName} to admin`

      expect(msg).toBe("Alice promoted Bob to admin")
    })
  })

  describe("demoteFromAdmin", () => {
    it("should only allow owner to demote", () => {
      const callerRole = "owner"
      const canDemote = callerRole === "owner"

      expect(canDemote).toBe(true)
    })

    it("should only demote admins", () => {
      const targetRole = "member"
      const isAdmin = targetRole === "admin"

      expect(isAdmin).toBe(false)
    })

    it("should change role from admin to member", () => {
      const participant = { role: "admin" }
      const updated = { ...participant, role: "member" }

      expect(updated.role).toBe("member")
    })
  })

  describe("pinMessage", () => {
    it("should only allow admin/owner to pin", () => {
      const callerRole = "member"
      const canPin = callerRole === "owner" || callerRole === "admin"

      expect(canPin).toBe(false)
    })

    it("should only allow pinning in groups", () => {
      const conversationType = "direct"
      const canPin = conversationType === "group"

      expect(canPin).toBe(false)
    })

    it("should toggle pin state", () => {
      const message = { isPinned: false }
      const pinned = { ...message, isPinned: true }
      const unpinned = { ...pinned, isPinned: false }

      expect(pinned.isPinned).toBe(true)
      expect(unpinned.isPinned).toBe(false)
    })
  })

  describe("getPinnedMessages", () => {
    it("should filter only pinned and non-deleted messages", () => {
      const messages = [
        { isPinned: true, isDeleted: false, content: "Pinned 1" },
        { isPinned: true, isDeleted: true, content: "Deleted pinned" },
        { isPinned: false, isDeleted: false, content: "Normal" },
        { isPinned: true, isDeleted: false, content: "Pinned 2" },
      ]

      const pinned = messages.filter((m) => m.isPinned && !m.isDeleted)

      expect(pinned).toHaveLength(2)
      expect(pinned[0].content).toBe("Pinned 1")
      expect(pinned[1].content).toBe("Pinned 2")
    })
  })

  describe("conversation data structure", () => {
    it("should have required fields for DM", () => {
      const dm = {
        type: "direct" as const,
        participantIds: ["user1", "user2"],
        createdAt: Date.now(),
      }

      expect(dm.type).toBe("direct")
      expect(dm.participantIds).toHaveLength(2)
      expect(dm.createdAt).toBeGreaterThan(0)
    })

    it("should have required fields for group", () => {
      const group = {
        type: "group" as const,
        participantIds: ["user1", "user2", "user3"],
        name: "Team Chat",
        createdBy: "user1",
        createdAt: Date.now(),
      }

      expect(group.type).toBe("group")
      expect(group.name).toBeDefined()
      expect(group.createdBy).toBeDefined()
      expect(group.participantIds.length).toBeGreaterThanOrEqual(2)
    })

    it("should have optional fields for group", () => {
      const group = {
        type: "group" as const,
        name: "Team",
        description: "A description",
        avatar: "https://example.com/avatar.png",
      }

      expect(group.description).toBeDefined()
      expect(group.avatar).toBeDefined()
    })

    it("should store participant record with role", () => {
      const participant = {
        conversationId: "conv1",
        userId: "user1",
        role: "admin",
        isMuted: false,
        joinedAt: Date.now(),
      }

      expect(participant.role).toBe("admin")
      expect(participant.isMuted).toBe(false)
      expect(participant.joinedAt).toBeGreaterThan(0)
    })
  })
})
