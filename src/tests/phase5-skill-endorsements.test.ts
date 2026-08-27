/**
 * @jest-environment node
 */
import { POST as endorseRoute, DELETE as removeEndorseRoute } from "@/app/api/skills/endorse/route"
import { GET as getEndorsementsRoute } from "@/app/api/skills/endorsements/route"

// Mock Supabase Server Client
const mockGetUser = jest.fn()
const mockSelect = jest.fn()
const mockUpsert = jest.fn()
const mockDelete = jest.fn()
const mockEq = jest.fn()
const mockSingle = jest.fn()

const mockSupabase = {
  auth: {
    getUser: mockGetUser,
  },
  from: jest.fn(() => ({
    select: mockSelect,
    upsert: mockUpsert,
    delete: mockDelete,
  })),
}

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabase)),
}))

describe("Phase 5 — P5-03 Interactive Skill Endorsements Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    const mockChain: any = {
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: mockSingle,
    }

    mockSelect.mockReturnValue(mockChain)
    mockDelete.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      }),
    })
    mockUpsert.mockReturnValue({
      select: jest.fn().mockReturnValue({ single: mockSingle }),
    })
  })

  describe("POST /api/skills/endorse", () => {
    it("should reject unauthenticated endorsement with 401", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } })

      const req = new Request("http://localhost:3000/api/skills/endorse", {
        method: "POST",
        body: JSON.stringify({ userId: "user-2", skill: "TypeScript" }),
      })
      const res = await endorseRoute(req)
      expect(res.status).toBe(401)
    })

    it("should reject self-endorsement with 400 Bad Request", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } } })

      const req = new Request("http://localhost:3000/api/skills/endorse", {
        method: "POST",
        body: JSON.stringify({ userId: "user-1", skill: "TypeScript" }),
      })
      const res = await endorseRoute(req)
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toMatch(/cannot endorse your own skills/i)
    })

    it("should reject endorsement if target user does not possess the skill", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "endorser-1" } } })

      // Target user only has Python
      mockSingle.mockResolvedValueOnce({
        data: { id: "target-2", skills: ["Python"] },
        error: null,
      })

      const req = new Request("http://localhost:3000/api/skills/endorse", {
        method: "POST",
        body: JSON.stringify({ userId: "target-2", skill: "Rust" }),
      })
      const res = await endorseRoute(req)
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toMatch(/does not list "Rust"/i)
    })

    it("should record endorsement and return success when valid", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "endorser-1" } } })

      mockSingle
        .mockResolvedValueOnce({
          data: { id: "target-2", skills: ["TypeScript", "Next.js"] },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: "endorsement-1", user_id: "target-2", skill: "TypeScript" },
          error: null,
        })

      const req = new Request("http://localhost:3000/api/skills/endorse", {
        method: "POST",
        body: JSON.stringify({ userId: "target-2", skill: "TypeScript" }),
      })
      const res = await endorseRoute(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
    })
  })

  describe("DELETE /api/skills/endorse", () => {
    it("should remove endorsement for the authenticated user", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "endorser-1" } } })

      const req = new Request("http://localhost:3000/api/skills/endorse", {
        method: "DELETE",
        body: JSON.stringify({ userId: "target-2", skill: "TypeScript" }),
      })
      const res = await removeEndorseRoute(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
    })
  })

  describe("GET /api/skills/endorsements", () => {
    it("should return skill endorsements aggregated by skill name", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "viewer-1" } } })

      mockSingle.mockResolvedValueOnce({
        data: { skills: ["React", "Python"] },
        error: null,
      })

      const mockEndorsementsList = [
        {
          skill: "React",
          endorser_id: "viewer-1",
          endorser: { name: "Alice" },
        },
        {
          skill: "React",
          endorser_id: "user-3",
          endorser: { name: "Bob" },
        },
      ]

      mockSelect.mockImplementation(() => ({
        eq: jest.fn((field: string) => {
          if (field === "id") {
            return { single: mockSingle }
          }
          return Promise.resolve({ data: mockEndorsementsList, error: null })
        }),
        single: mockSingle,
      }))

      const req = new Request("http://localhost:3000/api/skills/endorsements?userId=target-2")
      const res = await getEndorsementsRoute(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.skills).toHaveLength(2)

      const reactSkill = data.skills.find((s: any) => s.name === "React")
      expect(reactSkill.count).toBe(2)
      expect(reactSkill.endorsedByViewer).toBe(true)
    })
  })
})
