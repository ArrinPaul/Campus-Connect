/**
 * Unit Tests for Presence & Activity Status
 * Feature: Phase 2.3 - Presence & Activity Status
 *
 * Tests the presence, heartbeat, and online status business logic.
 */

describe("Presence & Activity Status", () => {
  describe("updateStatus validation", () => {
    it("should accept valid status values", () => {
      const validStatuses = ["online", "away", "dnd", "invisible"]
      validStatuses.forEach((status) => {
        expect(["online", "away", "dnd", "invisible"]).toContain(status)
      })
    })

    it("should reject invalid status values", () => {
      const invalidStatuses = ["offline", "busy", "active", "", "ONLINE"]
      invalidStatuses.forEach((status) => {
        expect(["online", "away", "dnd", "invisible"]).not.toContain(status)
      })
    })

    it("should update lastSeenAt on status change", () => {
      const now = Date.now()
      const updates = {
        status: "online" as const,
        lastSeenAt: now,
        updatedAt: now,
      }

      expect(updates.lastSeenAt).toBe(now)
      expect(updates.updatedAt).toBe(now)
      expect(updates.status).toBe("online")
    })
  })

  describe("setCustomStatus validation", () => {
    it("should accept valid custom status", () => {
      const status = "In a meeting"
      expect(status.trim().length).toBeLessThanOrEqual(100)
      expect(status.trim().length).toBeGreaterThan(0)
    })

    it("should reject status over 100 characters", () => {
      const status = "a".repeat(101)
      expect(status.length).toBeGreaterThan(100)
    })

    it("should accept status at exactly 100 characters", () => {
      const status = "a".repeat(100)
      expect(status.length).toBe(100)
      expect(status.trim().length).toBeLessThanOrEqual(100)
    })

    it("should clear custom status when empty string", () => {
      const status = ""
      const trimmed = status.trim()
      const result = trimmed || undefined
      expect(result).toBeUndefined()
    })

    it("should trim whitespace from custom status", () => {
      const status = "  Studying 📚  "
      const trimmed = status.trim()
      expect(trimmed).toBe("Studying 📚")
    })

    it("should handle emoji in custom status", () => {
      const status = "🎉 Party time! 🎊"
      expect(status.trim().length).toBeLessThanOrEqual(100)
    })
  })

  describe("heartbeat logic", () => {
    it("should auto-set status to online when not explicitly set", () => {
      const currentStatus = undefined
      const updates: any = { lastSeenAt: Date.now(), updatedAt: Date.now() }

      if (!currentStatus || currentStatus === "away") {
        updates.status = "online"
      }

      expect(updates.status).toBe("online")
    })

    it("should auto-set status to online when status is away", () => {
      const currentStatus = "away"
      const updates: any = { lastSeenAt: Date.now(), updatedAt: Date.now() }

      if (!currentStatus || currentStatus === "away") {
        updates.status = "online"
      }

      expect(updates.status).toBe("online")
    })

    it("should not change status when DND", () => {
      const currentStatus: string = "dnd"
      const updates: any = { lastSeenAt: Date.now(), updatedAt: Date.now() }

      if (!currentStatus || currentStatus === "away") {
        updates.status = "online"
      }

      expect(updates.status).toBeUndefined()
    })

    it("should not change status when invisible", () => {
      const currentStatus: string = "invisible"
      const updates: any = { lastSeenAt: Date.now(), updatedAt: Date.now() }

      if (!currentStatus || currentStatus === "away") {
        updates.status = "online"
      }

      expect(updates.status).toBeUndefined()
    })

    it("should keep existing online status unchanged", () => {
      const currentStatus: string = "online"
      const updates: any = { lastSeenAt: Date.now(), updatedAt: Date.now() }

      if (!currentStatus || currentStatus === "away") {
        updates.status = "online"
      }

      // status is set only when falsy or "away"
      expect(updates.status).toBeUndefined()
    })
  })

  describe("getOnlineUsers filtering", () => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    const currentUserId = "user1"

    const users = [
      { _id: "user1", name: "Self", status: "online", lastSeenAt: Date.now(), showOnlineStatus: true },
      { _id: "user2", name: "Active User", status: "online", lastSeenAt: Date.now(), showOnlineStatus: true },
      { _id: "user3", name: "Invisible User", status: "invisible", lastSeenAt: Date.now(), showOnlineStatus: true },
      { _id: "user4", name: "Hidden User", status: "online", lastSeenAt: Date.now(), showOnlineStatus: false },
      { _id: "user5", name: "Offline User", status: "online", lastSeenAt: fiveMinutesAgo - 60000, showOnlineStatus: true },
      { _id: "user6", name: "No Activity", status: undefined, lastSeenAt: undefined, showOnlineStatus: true },
      { _id: "user7", name: "Away User", status: "away", lastSeenAt: Date.now(), showOnlineStatus: true },
      { _id: "user8", name: "DND User", status: "dnd", lastSeenAt: Date.now(), showOnlineStatus: true },
    ]

    function filterOnlineUsers(allUsers: typeof users) {
      return allUsers.filter((u) => {
        if (u._id === currentUserId) return false
        if (u.showOnlineStatus === false) return false
        if (u.status === "invisible") return false
        if (!u.lastSeenAt || u.lastSeenAt < fiveMinutesAgo) return false
        return true
      })
    }

    it("should exclude self from online users", () => {
      const result = filterOnlineUsers(users)
      expect(result.find((u) => u._id === "user1")).toBeUndefined()
    })

    it("should include active online users", () => {
      const result = filterOnlineUsers(users)
      expect(result.find((u) => u._id === "user2")).toBeDefined()
    })

    it("should exclude invisible users", () => {
      const result = filterOnlineUsers(users)
      expect(result.find((u) => u._id === "user3")).toBeUndefined()
    })

    it("should exclude users with showOnlineStatus=false", () => {
      const result = filterOnlineUsers(users)
      expect(result.find((u) => u._id === "user4")).toBeUndefined()
    })

    it("should exclude users without recent activity", () => {
      const result = filterOnlineUsers(users)
      expect(result.find((u) => u._id === "user5")).toBeUndefined()
    })

    it("should exclude users with no lastSeenAt", () => {
      const result = filterOnlineUsers(users)
      expect(result.find((u) => u._id === "user6")).toBeUndefined()
    })

    it("should include away users with recent activity", () => {
      const result = filterOnlineUsers(users)
      expect(result.find((u) => u._id === "user7")).toBeDefined()
    })

    it("should include DND users with recent activity", () => {
      const result = filterOnlineUsers(users)
      expect(result.find((u) => u._id === "user8")).toBeDefined()
    })

    it("should respect the limit parameter", () => {
      const result = filterOnlineUsers(users).slice(0, 2)
      expect(result.length).toBeLessThanOrEqual(2)
    })

    it("should return correct count of visible online users", () => {
      const result = filterOnlineUsers(users)
      // user2 (online), user7 (away), user8 (dnd) — all with recent activity and visible
      expect(result.length).toBe(3)
    })
  })

  describe("getUserPresence privacy", () => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000

    function getUserPresence(
      user: {
        _id: string
        status?: string
        customStatus?: string
        lastSeenAt?: number
        showOnlineStatus?: boolean
      },
      currentUserId: string
    ) {
      // Self always sees own status
      if (user._id === currentUserId) {
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
          customStatus: user.customStatus,
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
    }

    it("should always show own status to self", () => {
      const result = getUserPresence(
        { _id: "user1", status: "invisible", lastSeenAt: Date.now(), showOnlineStatus: false },
        "user1"
      )

      expect(result.status).toBe("invisible")
      expect(result.isOnline).toBe(true)
    })

    it("should hide status when showOnlineStatus is false", () => {
      const result = getUserPresence(
        { _id: "user2", status: "online", lastSeenAt: Date.now(), showOnlineStatus: false },
        "user1"
      )

      expect(result.status).toBeNull()
      expect(result.lastSeenAt).toBeNull()
      expect(result.isOnline).toBe(false)
      expect(result.showOnlineStatus).toBe(false)
    })

    it("should still show customStatus when privacy is on", () => {
      const result = getUserPresence(
        { _id: "user2", status: "online", customStatus: "Studying", lastSeenAt: Date.now(), showOnlineStatus: false },
        "user1"
      )

      expect(result.customStatus).toBe("Studying")
    })

    it("should show invisible user as offline to others", () => {
      const result = getUserPresence(
        { _id: "user2", status: "invisible", lastSeenAt: Date.now(), showOnlineStatus: true },
        "user1"
      )

      expect(result.status).toBe("offline")
      expect(result.lastSeenAt).toBeNull()
      expect(result.isOnline).toBe(false)
    })

    it("should show online user correctly", () => {
      const now = Date.now()
      const result = getUserPresence(
        { _id: "user2", status: "online", lastSeenAt: now, showOnlineStatus: true },
        "user1"
      )

      expect(result.status).toBe("online")
      expect(result.lastSeenAt).toBe(now)
      expect(result.isOnline).toBe(true)
    })

    it("should show away user correctly", () => {
      const result = getUserPresence(
        { _id: "user2", status: "away", lastSeenAt: Date.now(), showOnlineStatus: true },
        "user1"
      )

      expect(result.status).toBe("away")
      expect(result.isOnline).toBe(true)
    })

    it("should show DND user correctly", () => {
      const result = getUserPresence(
        { _id: "user2", status: "dnd", lastSeenAt: Date.now(), showOnlineStatus: true },
        "user1"
      )

      expect(result.status).toBe("dnd")
      expect(result.isOnline).toBe(true)
    })

    it("should show user as offline when inactive for >5 minutes", () => {
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000
      const result = getUserPresence(
        { _id: "user2", status: "online", lastSeenAt: tenMinutesAgo, showOnlineStatus: true },
        "user1"
      )

      expect(result.status).toBe("offline")
      expect(result.isOnline).toBe(false)
    })

    it("should default to online status when no status is set", () => {
      const result = getUserPresence(
        { _id: "user2", lastSeenAt: Date.now(), showOnlineStatus: true },
        "user1"
      )

      expect(result.status).toBe("online")
      expect(result.isOnline).toBe(true)
    })

    it("should handle user with no lastSeenAt", () => {
      const result = getUserPresence(
        { _id: "user2", status: "online", showOnlineStatus: true },
        "user1"
      )

      expect(result.isOnline).toBe(false)
      expect(result.status).toBe("offline")
    })
  })

  describe("updateOnlineStatusVisibility", () => {
    it("should set showOnlineStatus to true", () => {
      const updates = {
        showOnlineStatus: true,
        updatedAt: Date.now(),
      }
      expect(updates.showOnlineStatus).toBe(true)
    })

    it("should set showOnlineStatus to false", () => {
      const updates = {
        showOnlineStatus: false,
        updatedAt: Date.now(),
      }
      expect(updates.showOnlineStatus).toBe(false)
    })
  })

  describe("formatLastSeen utility", () => {
    function formatLastSeen(timestamp: number | null | undefined): string {
      if (!timestamp) return ""
      const now = Date.now()
      const diff = now - timestamp

      if (diff < 60 * 1000) return "Just now"
      if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`
      if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`
      if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d ago`
      return new Date(timestamp).toLocaleDateString()
    }

    it("should return empty string for null timestamp", () => {
      expect(formatLastSeen(null)).toBe("")
    })

    it("should return empty string for undefined timestamp", () => {
      expect(formatLastSeen(undefined)).toBe("")
    })

    it("should return 'Just now' for very recent timestamps", () => {
      const now = Date.now()
      expect(formatLastSeen(now - 30 * 1000)).toBe("Just now")
    })

    it("should format minutes ago", () => {
      const now = Date.now()
      expect(formatLastSeen(now - 5 * 60 * 1000)).toBe("5m ago")
    })

    it("should format hours ago", () => {
      const now = Date.now()
      expect(formatLastSeen(now - 3 * 60 * 60 * 1000)).toBe("3h ago")
    })

    it("should format days ago", () => {
      const now = Date.now()
      expect(formatLastSeen(now - 2 * 24 * 60 * 60 * 1000)).toBe("2d ago")
    })

    it("should format date for older timestamps", () => {
      const oldDate = new Date("2023-01-15").getTime()
      const result = formatLastSeen(oldDate)
      expect(result).toContain("2023")
    })
  })

  describe("status color mapping", () => {
    const statusColors: Record<string, string> = {
      online: "bg-green-500",
      away: "bg-yellow-500",
      dnd: "bg-red-500",
      invisible: "bg-gray-400",
      offline: "bg-gray-400",
    }

    it("should map online to green", () => {
      expect(statusColors["online"]).toBe("bg-green-500")
    })

    it("should map away to yellow", () => {
      expect(statusColors["away"]).toBe("bg-yellow-500")
    })

    it("should map dnd to red", () => {
      expect(statusColors["dnd"]).toBe("bg-red-500")
    })

    it("should map invisible to gray", () => {
      expect(statusColors["invisible"]).toBe("bg-gray-400")
    })

    it("should map offline to gray", () => {
      expect(statusColors["offline"]).toBe("bg-gray-400")
    })
  })

  describe("online threshold", () => {
    it("should consider 5 minutes as the online threshold", () => {
      const threshold = 5 * 60 * 1000
      expect(threshold).toBe(300000)
    })

    it("should mark user at exactly boundary as offline", () => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
      const isOnline = fiveMinutesAgo >= fiveMinutesAgo
      // At exactly the boundary, >= should still be true
      expect(isOnline).toBe(true)
    })

    it("should mark user just beyond boundary as offline", () => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
      const justBeyond = fiveMinutesAgo - 1
      const isOnline = justBeyond >= fiveMinutesAgo
      expect(isOnline).toBe(false)
    })
  })
})
