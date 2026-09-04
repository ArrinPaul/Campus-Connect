/**
 * @jest-environment node
 *
 * Regression coverage for routes that were 501 stubs before this pass
 * (see docs/TASKS.md §1). These were exactly the kind of routes a clean
 * build/lint/typecheck never caught — a syntactically valid 501 stub
 * compiles fine. Mirrors the mocking pattern in marketplace-mutations.test.ts.
 */
import { POST as updateQuestion } from "@/app/api/questions/update/route"
import { POST as deleteQuestion } from "@/app/api/questions/delete/route"
import { POST as updateResource } from "@/app/api/resources/update/route"
import { POST as deleteResource } from "@/app/api/resources/delete/route"
import { GET as searchPostsRoute } from "@/app/api/search/posts/route"
import { GET as communitySlugRoute } from "@/app/api/communities/slug/route"

const mockGetUser = jest.fn()
const mockSelect = jest.fn()
const mockUpdate = jest.fn()
const mockDelete = jest.fn()
const mockSingle = jest.fn()
const mockOr = jest.fn()
const mockRange = jest.fn()
const mockOrder = jest.fn()
const mockIlike = jest.fn()

const mockSupabase = {
  auth: { getUser: mockGetUser },
  from: jest.fn(() => ({
    select: mockSelect,
    update: mockUpdate,
    delete: mockDelete,
  })),
  rpc: jest.fn().mockResolvedValue({ error: null }),
}

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabase)),
}))

describe("Regression: routes that used to 501", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase.rpc.mockResolvedValue({ error: null })

    const selectChain: any = { eq: jest.fn(), single: mockSingle, or: mockOr, ilike: mockIlike, order: mockOrder }
    selectChain.eq.mockReturnValue(selectChain)
    mockOr.mockReturnValue(selectChain)
    mockIlike.mockReturnValue(selectChain)
    mockOrder.mockReturnValue({ range: mockRange })
    mockSelect.mockReturnValue(selectChain)

    mockUpdate.mockReturnValue({
      eq: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: mockSingle }) }),
    })
    mockDelete.mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) })
  })

  describe("POST /api/questions/update", () => {
    it("rejects unauthenticated requests", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } })
      const req = new Request("http://localhost/api/questions/update", {
        method: "POST",
        body: JSON.stringify({ id: "q1", title: "x" }),
      })
      const res = await updateQuestion(req)
      expect(res.status).toBe(401)
    })

    it("rejects a non-author, non-admin editor with 403", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-2" } } })
      mockSingle
        .mockResolvedValueOnce({ data: { author_id: "user-1" }, error: null })
        .mockResolvedValueOnce({ data: { is_admin: false }, error: null })

      const req = new Request("http://localhost/api/questions/update", {
        method: "POST",
        body: JSON.stringify({ id: "q1", title: "Edited title" }),
      })
      const res = await updateQuestion(req)
      expect(res.status).toBe(403)
    })

    it("allows the author to update their own question", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } } })
      mockSingle
        .mockResolvedValueOnce({ data: { author_id: "user-1" }, error: null })
        .mockResolvedValueOnce({ data: { is_admin: false }, error: null })
        .mockResolvedValueOnce({ data: { id: "q1", title: "Edited title" }, error: null })

      const req = new Request("http://localhost/api/questions/update", {
        method: "POST",
        body: JSON.stringify({ id: "q1", title: "Edited title" }),
      })
      const res = await updateQuestion(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.title).toBe("Edited title")
    })
  })

  describe("POST /api/questions/delete", () => {
    it("rejects deletion by a non-author, non-admin user", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-2" } } })
      mockSingle
        .mockResolvedValueOnce({ data: { author_id: "user-1" }, error: null })
        .mockResolvedValueOnce({ data: { is_admin: false }, error: null })

      const req = new Request("http://localhost/api/questions/delete", {
        method: "POST",
        body: JSON.stringify({ id: "q1" }),
      })
      const res = await deleteQuestion(req)
      expect(res.status).toBe(403)
    })
  })

  describe("POST /api/resources/update", () => {
    it("rejects a non-uploader, non-admin editor with 403", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-2" } } })
      mockSingle
        .mockResolvedValueOnce({ data: { uploaded_by: "user-1" }, error: null })
        .mockResolvedValueOnce({ data: { is_admin: false }, error: null })

      const req = new Request("http://localhost/api/resources/update", {
        method: "POST",
        body: JSON.stringify({ id: "r1", title: "New title" }),
      })
      const res = await updateResource(req)
      expect(res.status).toBe(403)
    })
  })

  describe("POST /api/resources/delete", () => {
    it("allows the uploader to delete their own resource", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } } })
      mockSingle
        .mockResolvedValueOnce({ data: { uploaded_by: "user-1" }, error: null })
        .mockResolvedValueOnce({ data: { is_admin: false }, error: null })

      const req = new Request("http://localhost/api/resources/delete", {
        method: "POST",
        body: JSON.stringify({ id: "r1" }),
      })
      const res = await deleteResource(req)
      expect(res.status).toBe(200)
    })
  })

  describe("GET /api/search/posts", () => {
    it("returns an empty result for a blank query instead of erroring", async () => {
      const req = new Request("http://localhost/api/search/posts?q=")
      const res = await searchPostsRoute(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.posts).toEqual([])
    })

    it("returns matching posts for a real query", async () => {
      mockRange.mockResolvedValueOnce({ data: [{ id: "p1", content: "hello world" }], error: null })
      const req = new Request("http://localhost/api/search/posts?q=hello")
      const res = await searchPostsRoute(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.posts).toHaveLength(1)
    })
  })

  describe("GET /api/communities/slug", () => {
    it("requires a slug", async () => {
      const req = new Request("http://localhost/api/communities/slug")
      const res = await communitySlugRoute(req)
      expect(res.status).toBe(400)
    })

    it("404s when the community doesn't exist", async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: "not found" } })
      const req = new Request("http://localhost/api/communities/slug?slug=ghost-club")
      const res = await communitySlugRoute(req)
      expect(res.status).toBe(404)
    })
  })
})
