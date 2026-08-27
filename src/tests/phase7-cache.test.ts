/**
 * @jest-environment node
 */
import { MemoryCacheStore, cacheWrap } from "@/lib/cache"

describe("Phase 7 — P7-03 Multi-Tier Caching & Bounded TTL", () => {
  describe("MemoryCacheStore", () => {
    it("stores and retrieves values within TTL", () => {
      const store = new MemoryCacheStore()
      store.set("leaderboard:weekly", { topUser: "Alice" }, 10)
      const cached = store.get("leaderboard:weekly")
      expect(cached).toEqual({ topUser: "Alice" })
    })

    it("expires items past TTL", () => {
      const store = new MemoryCacheStore()
      store.set("temp_key", "temporary_val", -1) // Expired immediately
      const cached = store.get("temp_key")
      expect(cached).toBeNull()
    })

    it("deletes and clears keys on demand", () => {
      const store = new MemoryCacheStore()
      store.set("key1", 1, 60)
      store.set("key2", 2, 60)

      store.delete("key1")
      expect(store.get("key1")).toBeNull()
      expect(store.get("key2")).toBe(2)

      store.clear()
      expect(store.get("key2")).toBeNull()
    })
  })

  describe("cacheWrap Helper", () => {
    it("fetches value on cache miss and serves cached value on subsequent calls", async () => {
      const mockFetcher = jest.fn().mockResolvedValue({ hashtags: ["#ai", "#web3"] })

      const res1 = await cacheWrap("hashtags:test", 60, mockFetcher)
      expect(res1).toEqual({ hashtags: ["#ai", "#web3"] })
      expect(mockFetcher).toHaveBeenCalledTimes(1)

      const res2 = await cacheWrap("hashtags:test", 60, mockFetcher)
      expect(res2).toEqual({ hashtags: ["#ai", "#web3"] })
      // Fetcher should not be called again
      expect(mockFetcher).toHaveBeenCalledTimes(1)
    })
  })
})
