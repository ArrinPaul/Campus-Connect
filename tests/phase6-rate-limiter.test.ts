/**
 * @jest-environment node
 */
import { MemoryRateLimiter, UpstashRedisRateLimiter, rateLimit } from "@/lib/rate-limiter"

describe("Phase 6 — P6-04 Advanced Performance & Rate Limiting", () => {
  describe("MemoryRateLimiter", () => {
    it("should allow requests under the limit and decrement remaining", async () => {
      const limiter = new MemoryRateLimiter()
      const res1 = await limiter.limit("user:test:1", 5, 10000)
      expect(res1.success).toBe(true)
      expect(res1.limit).toBe(5)
      expect(res1.remaining).toBe(4)

      const res2 = await limiter.limit("user:test:1", 5, 10000)
      expect(res2.success).toBe(true)
      expect(res2.remaining).toBe(3)
    })

    it("should block requests exceeding the limit with retryAfter", async () => {
      const limiter = new MemoryRateLimiter()
      // Consume all 2 tokens
      await limiter.limit("user:test:blocked", 2, 5000)
      await limiter.limit("user:test:blocked", 2, 5000)

      // 3rd attempt
      const res3 = await limiter.limit("user:test:blocked", 2, 5000)
      expect(res3.success).toBe(false)
      expect(res3.remaining).toBe(0)
      expect(res3.retryAfter).toBeGreaterThan(0)
    })

    it("should allow resetting limits for an identifier", async () => {
      const limiter = new MemoryRateLimiter()
      await limiter.limit("user:test:reset", 1, 10000)
      const blocked = await limiter.limit("user:test:reset", 1, 10000)
      expect(blocked.success).toBe(false)

      await limiter.reset("user:test:reset")
      const afterReset = await limiter.limit("user:test:reset", 1, 10000)
      expect(afterReset.success).toBe(true)
    })
  })

  describe("UpstashRedisRateLimiter Fallback", () => {
    it("should gracefully fallback to memory when Redis is not configured", async () => {
      const redisLimiter = new UpstashRedisRateLimiter()
      const res = await redisLimiter.limit("user:redis:fallback", 10, 60000)
      expect(res.success).toBe(true)
      expect(res.remaining).toBe(9)
    })
  })

  describe("rateLimit Helper Function", () => {
    it("should return null when within limit", async () => {
      const req = new Request("http://localhost:3000/api/posts", {
        headers: { "x-forwarded-for": "192.168.1.100" },
      })

      const response = await rateLimit(req, { limit: 10, keyPrefix: "test_ok" })
      expect(response).toBeNull()
    })

    it("should return HTTP 429 NextResponse with Retry-After when exceeded", async () => {
      const req = new Request("http://localhost:3000/api/posts", {
        headers: { "x-forwarded-for": "192.168.1.200" },
      })

      // Limit of 1
      await rateLimit(req, { limit: 1, keyPrefix: "test_block" })
      const response = await rateLimit(req, { limit: 1, keyPrefix: "test_block" })

      expect(response).not.toBeNull()
      expect(response?.status).toBe(429)
      expect(response?.headers.get("Retry-After")).toBeDefined()
      expect(response?.headers.get("X-RateLimit-Limit")).toBe("1")
    })
  })
})
