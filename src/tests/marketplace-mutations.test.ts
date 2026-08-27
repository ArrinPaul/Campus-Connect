/**
 * @jest-environment node
 */
import { POST as updateRoute } from "@/app/api/marketplace/update/route"
import { POST as deleteRoute } from "@/app/api/marketplace/delete/route"
import { GET as singleRoute } from "@/app/api/marketplace/single/route"

// Mock Supabase Server Client
const mockGetUser = jest.fn()
const mockSelect = jest.fn()
const mockInsert = jest.fn()
const mockUpdate = jest.fn()
const mockDelete = jest.fn()
const mockEq = jest.fn()
const mockSingle = jest.fn()

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
}

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabase)),
}))

describe("Phase 4 — P4-04 Marketplace Listing Mutations Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    const mockSelectChain = {
      eq: jest.fn().mockReturnThis(),
      single: mockSingle,
    }

    mockSelect.mockReturnValue(mockSelectChain)
    mockEq.mockReturnValue(mockSelectChain)

    mockInsert.mockReturnValue({
      select: jest.fn().mockReturnValue({ single: mockSingle }),
    })
    mockUpdate.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({ single: mockSingle }),
      }),
    })
    mockDelete.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    })
  })

  describe("GET /api/marketplace/single", () => {
    it("should require id query parameter", async () => {
      const req = new Request("http://localhost:3000/api/marketplace/single")
      const res = await singleRoute(req)
      expect(res.status).toBe(400)
    })

    it("should return listing when found", async () => {
      mockSingle.mockResolvedValueOnce({
        data: { id: "listing-1", title: "Textbook", price: 25 },
        error: null,
      })

      const req = new Request("http://localhost:3000/api/marketplace/single?id=listing-1")
      const res = await singleRoute(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.title).toBe("Textbook")
    })
  })

  describe("POST /api/marketplace/update", () => {
    it("should reject unauthenticated requests with 401", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } })

      const req = new Request("http://localhost:3000/api/marketplace/update", {
        method: "POST",
        body: JSON.stringify({ id: "listing-1", price: 20 }),
      })
      const res = await updateRoute(req)
      expect(res.status).toBe(401)
    })

    it("should reject non-seller modification with 403 Forbidden", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "buyer-2" } } })

      mockSingle
        .mockResolvedValueOnce({ data: { posted_by: "seller-1" }, error: null }) // listing owner
        .mockResolvedValueOnce({ data: { is_admin: false }, error: null }) // user admin check

      const req = new Request("http://localhost:3000/api/marketplace/update", {
        method: "POST",
        body: JSON.stringify({ id: "listing-1", price: 10 }),
      })
      const res = await updateRoute(req)
      expect(res.status).toBe(403)
      const data = await res.json()
      expect(data.error).toMatch(/forbidden/i)
    })

    it("should allow seller to update price, title, and status", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "seller-1" } } })

      mockSingle
        .mockResolvedValueOnce({ data: { posted_by: "seller-1" }, error: null })
        .mockResolvedValueOnce({ data: { is_admin: false }, error: null })
        .mockResolvedValueOnce({
          data: { id: "listing-1", title: "Calculus Textbook", price: 30, status: "active" },
          error: null,
        })

      const req = new Request("http://localhost:3000/api/marketplace/update", {
        method: "POST",
        body: JSON.stringify({ id: "listing-1", title: "Calculus Textbook", price: 30 }),
      })
      const res = await updateRoute(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.price).toBe(30)
    })
  })

  describe("POST /api/marketplace/delete", () => {
    it("should reject non-owner deletion with 403 Forbidden", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "unrelated-user" } } })

      mockSingle
        .mockResolvedValueOnce({ data: { posted_by: "seller-1" }, error: null })
        .mockResolvedValueOnce({ data: { is_admin: false }, error: null })

      const req = new Request("http://localhost:3000/api/marketplace/delete", {
        method: "POST",
        body: JSON.stringify({ id: "listing-1" }),
      })
      const res = await deleteRoute(req)
      expect(res.status).toBe(403)
    })

    it("should allow owner to delete listing", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "seller-1" } } })

      mockSingle
        .mockResolvedValueOnce({ data: { posted_by: "seller-1" }, error: null })
        .mockResolvedValueOnce({ data: { is_admin: false }, error: null })

      const req = new Request("http://localhost:3000/api/marketplace/delete", {
        method: "POST",
        body: JSON.stringify({ id: "listing-1" }),
      })
      const res = await deleteRoute(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
    })
  })
})
