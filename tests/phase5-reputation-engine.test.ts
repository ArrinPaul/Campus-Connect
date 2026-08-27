/**
 * @jest-environment node
 */
import { awardReputation, revokeReputation, getUserReputation } from "@/server/db/gamification"
import { POST as questionVoteRoute } from "@/app/api/questions/vote/route"
import { POST as acceptAnswerRoute } from "@/app/api/questions/accept/route"

// Mock Supabase Server Client
const mockGetUser = jest.fn()
const mockSelect = jest.fn()
const mockInsert = jest.fn()
const mockUpdate = jest.fn()
const mockUpsert = jest.fn()
const mockDelete = jest.fn()
const mockEq = jest.fn()
const mockSingle = jest.fn()
const mockRpc = jest.fn()

const mockSupabase = {
  auth: {
    getUser: mockGetUser,
  },
  from: jest.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    upsert: mockUpsert,
    delete: mockDelete,
  })),
  rpc: mockRpc,
}

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabase)),
}))

describe("Phase 5 — P5-02 Reputation Engine & Duplicate Prevention", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    const mockChain = {
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: mockSingle,
    }

    mockSelect.mockReturnValue(mockChain)
    mockInsert.mockReturnValue({
      select: jest.fn().mockReturnValue({ single: mockSingle }),
    })
    mockUpdate.mockReturnValue({
      eq: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: mockSingle }) }),
    })
    mockUpsert.mockResolvedValue({ error: null })
    mockDelete.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    })
    mockRpc.mockResolvedValue({ data: null, error: null })
  })

  describe("Atomic Point Awards & Idempotency", () => {
    it("should award +15 reputation points for an accepted answer", async () => {
      mockSingle
        .mockResolvedValueOnce({ data: null, error: null }) // no existing reputation_events
        .mockResolvedValueOnce({ data: { id: "event-1" }, error: null }) // insert event
        .mockResolvedValueOnce({ data: { points: 10, level: 1, badges: [] }, error: null }) // current rep

      const res = await awardReputation({
        recipientId: "author-1",
        actorId: "question-owner-2",
        eventType: "accepted_answer",
        sourceType: "question_answer",
        sourceId: "answer-123",
        points: 15,
      })

      expect(res.success).toBe(true)
      expect(res.pointsAwarded).toBe(15)
      expect(res.totalPoints).toBe(25)
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "author-1",
          points: 25,
          level: 1,
        })
      )
    })

    it("should reject self-rewards when actor equals recipient", async () => {
      const res = await awardReputation({
        recipientId: "user-1",
        actorId: "user-1",
        eventType: "question_upvote",
        sourceType: "question",
        sourceId: "q-123",
        points: 5,
      })

      expect(res.skipped).toBe(true)
      expect(res.reason).toMatch(/self-rewards/i)
      expect(mockUpsert).not.toHaveBeenCalled()
    })

    it("should prevent duplicate point rewards for the same event", async () => {
      // Existing event found in database
      mockSingle.mockResolvedValueOnce({
        data: { id: "existing-event-1", points: 15 },
        error: null,
      })

      const res = await awardReputation({
        recipientId: "author-1",
        actorId: "user-2",
        eventType: "accepted_answer",
        sourceType: "question_answer",
        sourceId: "answer-123",
        points: 15,
      })

      expect(res.skipped).toBe(true)
      expect(res.reason).toMatch(/already awarded/i)
      expect(mockInsert).not.toHaveBeenCalled()
    })
  })

  describe("Reputation Revocation on Vote Removal", () => {
    it("should revoke points when an upvote is removed", async () => {
      mockSingle
        .mockResolvedValueOnce({ data: { id: "event-1", points: 5 }, error: null }) // existing event
        .mockResolvedValueOnce({ data: { points: 30, level: 1 }, error: null }) // current rep

      const res = await revokeReputation({
        recipientId: "author-1",
        eventType: "question_upvote",
        sourceId: "q-100",
      })

      expect(res.success).toBe(true)
      expect(res.pointsRevoked).toBe(5)
      expect(res.totalPoints).toBe(25)
      expect(mockDelete).toHaveBeenCalled()
    })

    it("should not reduce reputation below zero on revocation", async () => {
      mockSingle
        .mockResolvedValueOnce({ data: { id: "event-1", points: 10 }, error: null })
        .mockResolvedValueOnce({ data: { points: 5, level: 1 }, error: null }) // only 5 points currently

      const res = await revokeReputation({
        recipientId: "author-1",
        eventType: "research_vote",
        sourceId: "paper-100",
      })

      expect(res.success).toBe(true)
      expect(res.totalPoints).toBe(0)
    })
  })
})
