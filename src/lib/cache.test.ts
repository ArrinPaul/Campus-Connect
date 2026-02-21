import {
  cacheGet,
  cacheSet,
  cacheDel,
  cacheGetOrSet,
  cacheIncr,
  cacheExists,
  cacheInvalidatePrefix,
  CachePrefix,
  CacheTTL,
} from "./cache"

// Mock @upstash/redis
const mockGet = jest.fn()
const mockSet = jest.fn()
const mockDel = jest.fn()
const mockIncr = jest.fn()
const mockExpire = jest.fn()
const mockExists = jest.fn()
const mockScan = jest.fn()

jest.mock("@upstash/redis", () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: mockGet,
    set: mockSet,
    del: mockDel,
    incr: mockIncr,
    expire: mockExpire,
    exists: mockExists,
    scan: mockScan,
  })),
}))

describe("cache", () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.UPSTASH_REDIS_REST_URL = "https://test.upstash.io"
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token"
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  describe("cacheGet", () => {
    it("should return cached value", async () => {
      mockGet.mockResolvedValueOnce({ data: "cached" })
      const result = await cacheGet("test-key")
      expect(result).toEqual({ data: "cached" })
      expect(mockGet).toHaveBeenCalledWith("test-key")
    })

    it("should return null on miss", async () => {
      mockGet.mockResolvedValueOnce(null)
      const result = await cacheGet("missing-key")
      expect(result).toBeNull()
    })

    it("should return null on error", async () => {
      mockGet.mockRejectedValueOnce(new Error("Redis down"))
      const result = await cacheGet("test-key")
      expect(result).toBeNull()
    })
  })

  describe("cacheSet", () => {
    it("should set value with TTL", async () => {
      mockSet.mockResolvedValueOnce("OK")
      await cacheSet("test-key", { data: "value" }, 300)
      expect(mockSet).toHaveBeenCalledWith(
        "test-key",
        { data: "value" },
        { ex: 300 }
      )
    })

    it("should use default TTL", async () => {
      mockSet.mockResolvedValueOnce("OK")
      await cacheSet("test-key", "value")
      expect(mockSet).toHaveBeenCalledWith("test-key", "value", {
        ex: CacheTTL.MEDIUM,
      })
    })
  })

  describe("cacheDel", () => {
    it("should delete key", async () => {
      mockDel.mockResolvedValueOnce(1)
      await cacheDel("test-key")
      expect(mockDel).toHaveBeenCalledWith("test-key")
    })
  })

  describe("cacheGetOrSet", () => {
    it("should return cached value if exists", async () => {
      mockGet.mockResolvedValueOnce("cached-value")
      const fetcher = jest.fn()
      const result = await cacheGetOrSet("key", fetcher)
      expect(result).toBe("cached-value")
      expect(fetcher).not.toHaveBeenCalled()
    })

    it("should call fetcher and cache result on miss", async () => {
      mockGet.mockResolvedValueOnce(null)
      mockSet.mockResolvedValueOnce("OK")
      const fetcher = jest.fn().mockResolvedValueOnce("fresh-value")

      const result = await cacheGetOrSet("key", fetcher, 600)
      expect(result).toBe("fresh-value")
      expect(fetcher).toHaveBeenCalledTimes(1)
      expect(mockSet).toHaveBeenCalledWith("key", "fresh-value", { ex: 600 })
    })
  })

  describe("cacheIncr", () => {
    it("should increment counter", async () => {
      mockIncr.mockResolvedValueOnce(5)
      const result = await cacheIncr("counter")
      expect(result).toBe(5)
    })

    it("should set TTL on first increment", async () => {
      mockIncr.mockResolvedValueOnce(1)
      mockExpire.mockResolvedValueOnce(1)
      await cacheIncr("counter", 3600)
      expect(mockExpire).toHaveBeenCalledWith("counter", 3600)
    })

    it("should not set TTL on subsequent increments", async () => {
      mockIncr.mockResolvedValueOnce(2)
      await cacheIncr("counter", 3600)
      expect(mockExpire).not.toHaveBeenCalled()
    })
  })

  describe("cacheExists", () => {
    it("should return true if key exists", async () => {
      mockExists.mockResolvedValueOnce(1)
      const result = await cacheExists("key")
      expect(result).toBe(true)
    })

    it("should return false if key does not exist", async () => {
      mockExists.mockResolvedValueOnce(0)
      const result = await cacheExists("key")
      expect(result).toBe(false)
    })
  })

  describe("cacheInvalidatePrefix", () => {
    it("should delete all keys with prefix", async () => {
      mockScan.mockResolvedValueOnce([0, ["feed:1", "feed:2"]])
      mockDel.mockResolvedValueOnce(2)

      await cacheInvalidatePrefix(CachePrefix.FEED)

      expect(mockScan).toHaveBeenCalledWith(0, {
        match: "feed:*",
        count: 100,
      })
      expect(mockDel).toHaveBeenCalledWith("feed:1", "feed:2")
    })
  })

  describe("CachePrefix", () => {
    it("should have expected prefixes", () => {
      expect(CachePrefix.TRENDING).toBe("trending:")
      expect(CachePrefix.FEED).toBe("feed:")
      expect(CachePrefix.USER_PROFILE).toBe("user:")
      expect(CachePrefix.SUGGESTIONS).toBe("suggestions:")
    })
  })

  describe("CacheTTL", () => {
    it("should have expected TTLs", () => {
      expect(CacheTTL.SHORT).toBe(300)
      expect(CacheTTL.MEDIUM).toBe(900)
      expect(CacheTTL.LONG).toBe(3600)
      expect(CacheTTL.DAY).toBe(86400)
    })
  })
})
