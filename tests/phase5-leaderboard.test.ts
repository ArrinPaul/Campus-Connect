/**
 * @jest-environment node
 */
import { getLeaderboard } from "@/server/db/gamification"
import { GET as leaderboardRoute } from "@/app/api/leaderboard/route"

// Mock Supabase Server Client
const mockGetUser = jest.fn()
const mockSelect = jest.fn()
const mockEq = jest.fn()
const mockGt = jest.fn()
const mockGte = jest.fn()
const mockIn = jest.fn()
const mockOrder = jest.fn()
const mockSingle = jest.fn()

const mockSupabase = {
  auth: {
    getUser: mockGetUser,
  },
  from: jest.fn(() => ({
    select: mockSelect,
  })),
}

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabase)),
}))

describe("Phase 5 — P5-01 Gamification Leaderboard", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    const mockChain: any = {
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: mockSingle,
    }

    mockSelect.mockReturnValue(mockChain)
    mockOrder.mockReturnValue(mockChain)
    mockGt.mockReturnValue(mockChain)
    mockGte.mockReturnValue(mockChain)
    mockIn.mockReturnValue(mockChain)
    mockEq.mockReturnValue(mockChain)
  })

  describe("All-Time Leaderboard Ranking & Tie Breaking", () => {
    it("should rank users by points descending and break ties by name ascending", async () => {
      mockSelect.mockReturnValueOnce({
        gt: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [
              {
                user_id: "user-1",
                points: 120,
                level: 2,
                badges: [],
                user: { id: "user-1", name: "Bob", university: "MIT" },
              },
              {
                user_id: "user-2",
                points: 120,
                level: 2,
                badges: [],
                user: { id: "user-2", name: "Alice", university: "Stanford" },
              },
              {
                user_id: "user-3",
                points: 200,
                level: 3,
                badges: [],
                user: { id: "user-3", name: "Charlie", university: "Harvard" },
              },
            ],
            error: null,
          }),
        }),
      })

      const res = await getLeaderboard({ period: "all-time", currentUserId: "user-2" })

      expect(res.entries).toHaveLength(3)
      // Rank 1: Charlie (200 pts)
      expect(res.entries[0].name).toBe("Charlie")
      expect(res.entries[0].rank).toBe(1)
      // Rank 2: Alice (120 pts, 'Alice' < 'Bob')
      expect(res.entries[1].name).toBe("Alice")
      expect(res.entries[1].rank).toBe(2)
      // Rank 3: Bob (120 pts)
      expect(res.entries[2].name).toBe("Bob")
      expect(res.entries[2].rank).toBe(3)

      // Current user rank
      expect(res.currentUserRank).toBe(2)
      expect(res.currentUserPoints).toBe(120)
    })

    it("should filter leaderboard entries by specific university", async () => {
      mockSelect.mockReturnValueOnce({
        gt: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [
              {
                user_id: "user-1",
                points: 100,
                user: { id: "user-1", name: "Bob", university: "MIT" },
              },
              {
                user_id: "user-2",
                points: 80,
                user: { id: "user-2", name: "Alice", university: "Stanford" },
              },
            ],
            error: null,
          }),
        }),
      })

      const res = await getLeaderboard({ period: "all-time", university: "Stanford" })
      expect(res.entries).toHaveLength(1)
      expect(res.entries[0].university).toBe("Stanford")
      expect(res.entries[0].name).toBe("Alice")
      expect(res.entries[0].rank).toBe(1)
    })
  })

  describe("Weekly & Monthly Leaderboard Queries", () => {
    it("should aggregate points from reputation_events within period", async () => {
      // 1. Period events
      mockSelect
        .mockReturnValueOnce({
          gte: jest.fn().mockResolvedValue({
            data: [
              { recipient_user_id: "user-1", points: 15 },
              { recipient_user_id: "user-1", points: 10 },
              { recipient_user_id: "user-2", points: 5 },
            ],
          }),
        })
        // 2. Users query
        .mockReturnValueOnce({
          in: jest.fn().mockResolvedValue({
            data: [
              { id: "user-1", name: "Alice", university: "MIT" },
              { id: "user-2", name: "Bob", university: "MIT" },
            ],
          }),
        })
        // 3. User reputations query
        .mockReturnValueOnce({
          in: jest.fn().mockResolvedValue({
            data: [
              { user_id: "user-1", level: 1, badges: [] },
              { user_id: "user-2", level: 1, badges: [] },
            ],
          }),
        })

      const res = await getLeaderboard({ period: "weekly", currentUserId: "user-1" })

      expect(res.period).toBe("weekly")
      expect(res.entries).toHaveLength(2)
      expect(res.entries[0].userId).toBe("user-1")
      expect(res.entries[0].points).toBe(25) // 15 + 10
      expect(res.entries[0].rank).toBe(1)

      expect(res.entries[1].userId).toBe("user-2")
      expect(res.entries[1].points).toBe(5)
      expect(res.entries[1].rank).toBe(2)

      expect(res.currentUserRank).toBe(1)
    })
  })

  describe("GET /api/leaderboard Route Handler", () => {
    it("should respond with leaderboard json payload", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } } })
      mockSelect.mockReturnValueOnce({
        gt: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [
              {
                user_id: "user-1",
                points: 50,
                user: { id: "user-1", name: "Scholar One", university: "Oxford" },
              },
            ],
          }),
        }),
      })

      const req = new Request("http://localhost:3000/api/leaderboard?period=all-time&limit=10")
      const res = await leaderboardRoute(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.entries).toHaveLength(1)
      expect(data.entries[0].name).toBe("Scholar One")
    })
  })
})
