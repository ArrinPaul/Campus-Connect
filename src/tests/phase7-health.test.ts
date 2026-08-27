/**
 * @jest-environment node
 */
import { GET as healthRoute } from "@/app/api/health/route"
import { GET as readyRoute } from "@/app/api/health/ready/route"

// Mock Supabase Server Client
const mockSelect = jest.fn()
const mockSupabase = {
  from: jest.fn(() => ({
    select: mockSelect,
  })),
}

jest.mock("@/lib/supabase/server", () => ({
  createAdminClient: jest.fn(() => mockSupabase),
}))

describe("Phase 7 — P7-09 Health Checks & Operability", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSelect.mockReturnValue({
      limit: jest.fn().mockResolvedValue({ data: [{ id: "u-1" }], error: null }),
    })
  })

  describe("GET /api/health (Liveness)", () => {
    it("returns HTTP 200 with status ok and version", async () => {
      const res = await healthRoute()
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.status).toBe("ok")
      expect(data).toHaveProperty("version")
      expect(data).toHaveProperty("environment")
      expect(data).toHaveProperty("timestamp")
    })
  })

  describe("GET /api/health/ready (Readiness)", () => {
    it("returns HTTP 200 ready when database probe succeeds", async () => {
      const res = await readyRoute()
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.status).toBe("ready")
      expect(data.checks.database).toBe("connected")
    })
  })
})
