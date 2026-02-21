/**
 * @jest-environment node
 */

const mockLimit = jest.fn()

jest.mock("@upstash/redis", () => ({
  Redis: jest.fn().mockImplementation(() => ({})),
}))

jest.mock("@upstash/ratelimit", () => {
  const MockRatelimit = jest.fn().mockImplementation(() => ({
    limit: mockLimit,
  })) as any
  MockRatelimit.slidingWindow = jest
    .fn()
    .mockReturnValue("sliding-window-config")
  return { Ratelimit: MockRatelimit }
})

import { checkRateLimit, getRateLimitHeaders, withRateLimit } from "./rate-limit"

describe("rate-limit", () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.UPSTASH_REDIS_REST_URL = "https://test.upstash.io"
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token"
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  describe("checkRateLimit", () => {
    it("should allow requests within limit", async () => {
      mockLimit.mockResolvedValueOnce({
        success: true,
        limit: 100,
        remaining: 95,
        reset: Date.now() + 60000,
      })

      const result = await checkRateLimit("api", "user-123")
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(95)
    })

    it("should reject requests over limit", async () => {
      mockLimit.mockResolvedValueOnce({
        success: false,
        limit: 100,
        remaining: 0,
        reset: Date.now() + 30000,
      })

      const result = await checkRateLimit("api", "user-123")
      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it("should fail open on error", async () => {
      mockLimit.mockRejectedValueOnce(new Error("Redis down"))
      const result = await checkRateLimit("api", "user-123")
      expect(result.success).toBe(true)
    })
  })

  describe("getRateLimitHeaders", () => {
    it("should return correct headers", () => {
      const headers = getRateLimitHeaders({
        success: true,
        limit: 100,
        remaining: 50,
        reset: 1700000000,
      })

      expect(headers["X-RateLimit-Limit"]).toBe("100")
      expect(headers["X-RateLimit-Remaining"]).toBe("50")
      expect(headers["X-RateLimit-Reset"]).toBe("1700000000")
    })
  })

  describe("withRateLimit", () => {
    it("should allow requests within limit", async () => {
      mockLimit.mockResolvedValueOnce({
        success: true,
        limit: 10,
        remaining: 9,
        reset: Date.now() + 60000,
      })

      const handler = jest.fn().mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )

      const wrapped = withRateLimit("post", handler)
      const req = new Request("http://localhost/api/posts", {
        method: "POST",
        headers: { "x-forwarded-for": "1.2.3.4" },
      })

      const response = await wrapped(req)
      expect(response.status).toBe(200)
      expect(handler).toHaveBeenCalled()
      expect(response.headers.get("X-RateLimit-Limit")).toBe("10")
    })

    it("should reject requests over limit with 429", async () => {
      const reset = Date.now() + 30000
      mockLimit.mockResolvedValueOnce({
        success: false,
        limit: 10,
        remaining: 0,
        reset,
      })

      const handler = jest.fn()
      const wrapped = withRateLimit("post", handler)
      const req = new Request("http://localhost/api/posts", {
        method: "POST",
        headers: { "x-forwarded-for": "1.2.3.4" },
      })

      const response = await wrapped(req)
      expect(response.status).toBe(429)
      expect(handler).not.toHaveBeenCalled()

      const body = await response.json()
      expect(body.error).toBe("Too many requests")
      expect(body.retryAfter).toBeGreaterThan(0)
    })

    it("should use custom identifier extractor", async () => {
      mockLimit.mockResolvedValueOnce({
        success: true,
        limit: 10,
        remaining: 9,
        reset: Date.now() + 60000,
      })

      const handler = jest
        .fn()
        .mockResolvedValueOnce(new Response("ok", { status: 200 }))

      const wrapped = withRateLimit("api", handler, () => "custom-id")
      const req = new Request("http://localhost/api/test")

      await wrapped(req)
      expect(mockLimit).toHaveBeenCalledWith("custom-id")
    })
  })
})
