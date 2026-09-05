/**
 * @jest-environment node
 *
 * More regression coverage for routes fixed from 501 stubs this session
 * (docs/TASKS.md §5 — the first batch is in stub-routes-regression.test.ts).
 */
import { GET as hashtagsSearchRoute } from "@/app/api/hashtags/search/route"
import { GET as repostsCheckRoute } from "@/app/api/reposts/check/route"
import { GET as pollSingleRoute } from "@/app/api/polls/single/route"
import { POST as removeMemberRoute } from "@/app/api/communities/members/remove/route"

const mockGetUser = jest.fn()
const mockSingle = jest.fn()
const mockIlike = jest.fn()
const mockLimit = jest.fn()
const mockEq = jest.fn()

const mockSupabase = {
  auth: { getUser: mockGetUser },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      ilike: mockIlike,
      eq: mockEq,
      single: mockSingle,
    })),
  })),
}

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabase)),
}))

describe("Regression: second batch of previously-stubbed routes", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIlike.mockReturnValue({ order: jest.fn(() => ({ limit: mockLimit })) })
    mockEq.mockReturnValue({ eq: mockEq, single: mockSingle })
  })

  describe("GET /api/hashtags/search", () => {
    it("returns an empty list for a blank query", async () => {
      const req = new Request("http://localhost/api/hashtags/search?q=")
      const res = await hashtagsSearchRoute(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.hashtags).toEqual([])
    })

    it("returns matching hashtags for a real query", async () => {
      mockLimit.mockResolvedValueOnce({ data: [{ tag: "campuslife", post_count: 42 }] })
      const req = new Request("http://localhost/api/hashtags/search?q=campus")
      const res = await hashtagsSearchRoute(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.hashtags).toHaveLength(1)
    })
  })

  describe("GET /api/reposts/check", () => {
    it("rejects unauthenticated requests", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } })
      const req = new Request("http://localhost/api/reposts/check?postId=p1")
      const res = await repostsCheckRoute(req)
      expect(res.status).toBe(401)
    })

    it("requires a postId", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } } })
      const req = new Request("http://localhost/api/reposts/check")
      const res = await repostsCheckRoute(req)
      expect(res.status).toBe(400)
    })
  })

  describe("GET /api/polls/single", () => {
    it("requires a poll id", async () => {
      const req = new Request("http://localhost/api/polls/single")
      const res = await pollSingleRoute(req)
      expect(res.status).toBe(400)
    })

    it("404s when the poll doesn't exist", async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: "not found" } })
      const req = new Request("http://localhost/api/polls/single?id=poll-1")
      const res = await pollSingleRoute(req)
      expect(res.status).toBe(404)
    })
  })

  describe("POST /api/communities/members/remove", () => {
    it("rejects a non-moderator with 403", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-2" } } })
      mockSingle.mockResolvedValueOnce({ data: { role: "member" } }) // isCommunityModerator check

      const req = new Request("http://localhost/api/communities/members/remove", {
        method: "POST",
        body: JSON.stringify({ communityId: "c1", memberUserId: "target-1" }),
      })
      const res = await removeMemberRoute(req)
      expect(res.status).toBe(403)
    })

    it("refuses to remove a community admin", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "mod-1" } } })
      mockSingle
        .mockResolvedValueOnce({ data: { role: "moderator" } }) // isCommunityModerator check (caller)
        .mockResolvedValueOnce({ data: { role: "admin" } }) // target member's role

      const req = new Request("http://localhost/api/communities/members/remove", {
        method: "POST",
        body: JSON.stringify({ communityId: "c1", memberUserId: "admin-1" }),
      })
      const res = await removeMemberRoute(req)
      expect(res.status).toBe(403)
      const data = await res.json()
      expect(data.error).toMatch(/admin/i)
    })
  })
})
