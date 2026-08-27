/**
 * @jest-environment node
 */
import fc from "fast-check"
import { MemoryRateLimiter } from "@/lib/rate-limiter"
import { POST as subscribeRoute } from "@/app/api/push/subscribe/route"
import { POST as checkoutRoute } from "@/app/api/subscriptions/checkout/route"

// Mock Supabase Server Client
const mockGetUser = jest.fn()
const mockSupabase = {
  auth: {
    getUser: mockGetUser,
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockResolvedValue({ error: null }),
    upsert: jest.fn().mockResolvedValue({ error: null }),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
  })),
}

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabase)),
  createAdminClient: jest.fn(() => mockSupabase),
}))

describe("Phase 6 — P6-08 Security Audit & Property Invariants", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("Authentication Gate Enforcement", () => {
    it("rejects unauthenticated requests to push subscribe across arbitrary payloads", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            endpoint: fc.webUrl(),
            p256dh: fc.string(),
            auth: fc.string(),
          }),
          async (body) => {
            const req = new Request("http://localhost:3000/api/push/subscribe", {
              method: "POST",
              body: JSON.stringify(body),
            })
            const res = await subscribeRoute(req)
            expect(res.status).toBe(401)
          }
        ),
        { numRuns: 20 }
      )
    })

    it("rejects unauthenticated requests to subscriptions checkout", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            plan: fc.string(),
          }),
          async (body) => {
            const req = new Request("http://localhost:3000/api/subscriptions/checkout", {
              method: "POST",
              body: JSON.stringify(body),
            })
            const res = await checkoutRoute(req)
            expect(res.status).toBe(401)
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  describe("RateLimiter Mathematical Invariants (Property-Based)", () => {
    it("guarantees remaining tokens never go below 0", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 20 }),
          fc.integer({ min: 1, max: 50 }),
          async (limitCount, requestAttempts) => {
            const limiter = new MemoryRateLimiter()
            const id = `user_${Math.random()}`

            for (let i = 0; i < requestAttempts; i++) {
              const res = await limiter.limit(id, limitCount, 60000)
              expect(res.remaining).toBeGreaterThanOrEqual(0)
              if (i < limitCount) {
                expect(res.success).toBe(true)
              } else {
                expect(res.success).toBe(false)
                expect(res.remaining).toBe(0)
              }
            }
          }
        ),
        { numRuns: 15 }
      )
    })
  })
})
