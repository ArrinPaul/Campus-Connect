/**
 * @jest-environment node
 */
import {
  computeJaccardSimilarity,
  computeCosineSimilarity,
  calculateUserMatchScore,
} from "@/server/recommendations/matching-engine"
import { GET as getMatchingRoute } from "@/app/api/matching/route"
import { GET as getScoreRoute } from "@/app/api/matching/score/route"

// Mock Supabase Server Client
const mockGetUser = jest.fn()
const mockSelect = jest.fn()
const mockSingle = jest.fn()

const mockSupabase = {
  auth: {
    getUser: mockGetUser,
  },
  from: jest.fn(() => ({
    select: mockSelect,
    neq: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    range: jest.fn().mockResolvedValue({
      data: [
        {
          id: "cand-1",
          name: "Bob",
          username: "bob",
          university: "MIT",
          department: "Computer Science",
          skills: ["React", "TypeScript", "Python"],
          bio: "AI researcher and web developer",
        },
      ],
      error: null,
    }),
  })),
}

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabase)),
  createAdminClient: jest.fn(() => mockSupabase),
}))

describe("Phase 7 — P7-02 Recommendation Engine & Matching", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    const mockCandidates = [
      {
        id: "cand-1",
        name: "Bob",
        username: "bob",
        university: "MIT",
        department: "Computer Science",
        skills: ["React", "TypeScript", "Python"],
        bio: "AI researcher and web developer",
      },
    ]

    const mockChain: any = {
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: mockCandidates, error: null }),
      single: mockSingle,
    }
    mockSelect.mockReturnValue(mockChain)
  })

  describe("Mathematical Utilities", () => {
    it("computes Jaccard similarity accurately", () => {
      const setA = ["React", "TypeScript", "Node"]
      const setB = ["React", "Python", "TypeScript"]
      // Intersection: React, TypeScript (2). Union: React, TypeScript, Node, Python (4). Score: 0.5
      expect(computeJaccardSimilarity(setA, setB)).toBe(0.5)
    })

    it("computes Cosine similarity accurately for normalized vectors", () => {
      const vecA = [1, 0, 0]
      const vecB = [1, 0, 0]
      expect(computeCosineSimilarity(vecA, vecB)).toBe(1)

      const vecOrthogonal = [0, 1, 0]
      expect(computeCosineSimilarity(vecA, vecOrthogonal)).toBe(0)
    })
  })

  describe("calculateUserMatchScore Multi-Factor Model", () => {
    it("awards high scores to users with identical university, department, and skills", () => {
      const userA = {
        name: "Alice",
        university: "Stanford",
        department: "Bioinformatics",
        skills: ["Genomics", "Python", "Next.js"],
        bio: "Interested in computational biology",
      }

      const userB = {
        name: "Bob",
        university: "Stanford",
        department: "Bioinformatics",
        skills: ["Genomics", "Python", "Rust"],
        bio: "Computational biology researcher",
      }

      const result = calculateUserMatchScore(userA, userB)
      expect(result.score).toBeGreaterThan(60)
      expect(result.reasons.length).toBeGreaterThan(0)
      expect(result.factors.universityMatch).toBe(true)
    })
  })

  describe("GET /api/matching", () => {
    it("rejects unauthenticated requests with 401", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } })

      const req = new Request("http://localhost:3000/api/matching")
      const res = await getMatchingRoute(req)
      expect(res.status).toBe(401)
    })

    it("returns ranked partner recommendations for authenticated users", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-alice" } } })
      mockSingle.mockResolvedValueOnce({
        data: {
          id: "user-alice",
          name: "Alice",
          university: "MIT",
          skills: ["React", "TypeScript"],
        },
      })

      const req = new Request("http://localhost:3000/api/matching?university=MIT")
      const res = await getMatchingRoute(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(Array.isArray(data)).toBe(true)
    })
  })

  describe("GET /api/matching/score", () => {
    it("requires targetUserId parameter", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-alice" } } })

      const req = new Request("http://localhost:3000/api/matching/score")
      const res = await getScoreRoute(req)
      expect(res.status).toBe(400)
    })
  })
})
