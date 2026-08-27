/**
 * @jest-environment node
 */
import { MockEmbeddingProvider, getEmbeddingProvider } from "@/server/recommendations/embedding-provider"
import { GET as searchResearchRoute } from "@/app/api/research/search/route"

// Mock Supabase Server Client
const mockSelect = jest.fn()
const mockSupabase = {
  from: jest.fn(() => ({
    select: mockSelect,
  })),
}

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabase)),
  createAdminClient: jest.fn(() => mockSupabase),
}))

describe("Phase 7 — P7-02 Semantic Vector Search", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    const mockChain: any = {
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({
        data: [
          {
            id: "paper-1",
            title: "Deep Learning for Genomic Variant Pathogenicity",
            abstract: "Neural network architectures for RNA sequencing.",
          },
        ],
        error: null,
      }),
      or: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({
        data: [
          {
            id: "paper-1",
            title: "Deep Learning for Genomic Variant Pathogenicity",
          },
        ],
        error: null,
      }),
    }

    mockSelect.mockReturnValue(mockChain)
  })

  describe("Embedding Provider", () => {
    it("generates deterministic unit vectors for input strings", async () => {
      const provider = new MockEmbeddingProvider()
      const vec1 = await provider.generateEmbedding("Quantum Computing Algorithms")
      const vec2 = await provider.generateEmbedding("Quantum Computing Algorithms")

      expect(vec1.length).toBe(128)
      expect(vec1).toEqual(vec2)

      // Magnitude should be ~1.0
      const mag = Math.sqrt(vec1.reduce((sum, v) => sum + v * v, 0))
      expect(mag).toBeCloseTo(1, 4)
    })

    it("falls back to MockEmbeddingProvider in test/offline environment", () => {
      const provider = getEmbeddingProvider()
      expect(provider).toBeDefined()
      expect(typeof provider.generateEmbedding).toBe("function")
    })
  })

  describe("GET /api/research/search", () => {
    it("returns search results for query", async () => {
      const req = new Request("http://localhost:3000/api/research/search?q=machine+learning")
      const res = await searchResearchRoute(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(Array.isArray(data)).toBe(true)
    })
  })
})
