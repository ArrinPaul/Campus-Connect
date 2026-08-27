/**
 * @jest-environment node
 */
import { POST as voteRoute } from "@/app/api/research/vote/route"
import { POST as reviewRoute } from "@/app/api/research/review/route"
import { GET as singleRoute } from "@/app/api/research/single/route"
import { POST as updateRoute } from "@/app/api/research/update/route"
import { POST as deleteRoute } from "@/app/api/research/delete/route"

// Mock Supabase Server Client
const mockGetUser = jest.fn()
const mockSelect = jest.fn()
const mockInsert = jest.fn()
const mockUpdate = jest.fn()
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
    delete: mockDelete,
  })),
  rpc: mockRpc,
}

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabase)),
}))

describe("Phase 4 — P4-02 Research Paper Reviews & Voting Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockSelect.mockReturnValue({
      eq: mockEq,
      single: mockSingle,
    })
    mockEq.mockReturnValue({
      eq: mockEq,
      single: mockSingle,
    })
    mockInsert.mockReturnValue({
      select: jest.fn().mockReturnValue({ single: mockSingle }),
    })
    mockUpdate.mockReturnValue({
      eq: mockEq,
      select: jest.fn().mockReturnValue({ single: mockSingle }),
    })
    mockDelete.mockReturnValue({
      eq: mockEq,
    })
    mockRpc.mockResolvedValue({ data: null, error: null })
  })

  describe("POST /api/research/vote", () => {
    it("should reject unauthenticated voting with 401", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } })

      const req = new Request("http://localhost:3000/api/research/vote", {
        method: "POST",
        body: JSON.stringify({ paperId: "paper-123", voteType: "up" }),
      })
      const res = await voteRoute(req)
      expect(res.status).toBe(401)
    })

    it("should require paperId parameter with 400", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } } })

      const req = new Request("http://localhost:3000/api/research/vote", {
        method: "POST",
        body: JSON.stringify({ voteType: "up" }),
      })
      const res = await voteRoute(req)
      expect(res.status).toBe(400)
    })

    it("should atomically record new upvote and call increment_field", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } } })

      // Paper exists check
      mockSingle
        .mockResolvedValueOnce({ data: { id: "paper-123" }, error: null }) // paper exists
        .mockResolvedValueOnce({ data: null, error: null }) // no existing vote
        .mockResolvedValueOnce({ data: { vote_count: 5 }, error: null }) // updated vote_count

      const req = new Request("http://localhost:3000/api/research/vote", {
        method: "POST",
        body: JSON.stringify({ paperId: "paper-123", voteType: "up" }),
      })
      const res = await voteRoute(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.voteCount).toBe(5)
      expect(data.userVote).toBe("up")

      expect(mockRpc).toHaveBeenCalledWith("increment_field", {
        table_name: "research_papers",
        field_name: "vote_count",
        row_id: "paper-123",
        increment_by: 1,
      })
    })

    it("should toggle off vote if user votes same type again", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } } })

      mockSingle
        .mockResolvedValueOnce({ data: { id: "paper-123" }, error: null })
        .mockResolvedValueOnce({ data: { id: "reaction-1", type: "up" }, error: null }) // existing upvote
        .mockResolvedValueOnce({ data: { vote_count: 4 }, error: null })

      const req = new Request("http://localhost:3000/api/research/vote", {
        method: "POST",
        body: JSON.stringify({ paperId: "paper-123", voteType: "up" }),
      })
      const res = await voteRoute(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.userVote).toBeNull()

      expect(mockRpc).toHaveBeenCalledWith("increment_field", {
        table_name: "research_papers",
        field_name: "vote_count",
        row_id: "paper-123",
        increment_by: -1,
      })
    })
  })

  describe("POST /api/research/review", () => {
    it("should validate rating range (1-5) and require comments", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "reviewer-1" } } })

      const req = new Request("http://localhost:3000/api/research/review", {
        method: "POST",
        body: JSON.stringify({ paperId: "paper-123", rating: 6, comments: "Good" }),
      })
      const res = await reviewRoute(req)
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toMatch(/between 1 and 5/i)
    })

    it("should reject author self-review with 403 Forbidden", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "author-1" } } })

      mockSingle.mockResolvedValueOnce({
        data: { id: "paper-123", uploaded_by: "author-1" },
        error: null,
      })

      const req = new Request("http://localhost:3000/api/research/review", {
        method: "POST",
        body: JSON.stringify({
          paperId: "paper-123",
          rating: 5,
          comments: "My own paper is amazing",
        }),
      })
      const res = await reviewRoute(req)
      expect(res.status).toBe(403)
      const data = await res.json()
      expect(data.error).toMatch(/authors cannot submit peer reviews/i)
    })

    it("should accept valid peer review and increment review_count", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "peer-reviewer-2" } } })

      mockSingle.mockResolvedValueOnce({
        data: { id: "paper-123", uploaded_by: "author-1" },
        error: null,
      })

      const req = new Request("http://localhost:3000/api/research/review", {
        method: "POST",
        body: JSON.stringify({
          paperId: "paper-123",
          rating: 4,
          comments: "Strong methodology with clear reproducible findings.",
          recommendation: "accept",
        }),
      })
      const res = await reviewRoute(req)
      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.rating).toBe(4)
      expect(data.recommendation).toBe("accept")

      expect(mockRpc).toHaveBeenCalledWith("increment_field", {
        table_name: "research_papers",
        field_name: "review_count",
        row_id: "paper-123",
        increment_by: 1,
      })
    })
  })

  describe("PATCH /api/research/update & DELETE /api/research/delete Authorization", () => {
    it("should block non-authors from updating paper with 403", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "stranger-1" } } })

      mockSingle
        .mockResolvedValueOnce({ data: { uploaded_by: "author-1" }, error: null }) // paper owner
        .mockResolvedValueOnce({ data: { is_admin: false }, error: null }) // user admin check

      const req = new Request("http://localhost:3000/api/research/update", {
        method: "POST",
        body: JSON.stringify({ id: "paper-123", title: "Hacked title" }),
      })
      const res = await updateRoute(req)
      expect(res.status).toBe(403)
    })

    it("should allow paper author to delete paper", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "author-1" } } })

      mockSingle
        .mockResolvedValueOnce({ data: { uploaded_by: "author-1" }, error: null })
        .mockResolvedValueOnce({ data: { is_admin: false }, error: null })

      const req = new Request("http://localhost:3000/api/research/delete", {
        method: "POST",
        body: JSON.stringify({ id: "paper-123" }),
      })
      const res = await deleteRoute(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
    })
  })
})
