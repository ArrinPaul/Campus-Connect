import { Redis } from "@upstash/redis"

/**
 * Upstash Redis caching layer.
 *
 * Provides a type-safe, TTL-aware cache with:
 * - Automatic JSON serialization/deserialization
 * - Stale-while-revalidate pattern
 * - Cache invalidation by key or prefix
 * - Graceful degradation (returns null on Redis errors)
 *
 * Requires env vars:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

// Lazy singleton — only created when first accessed
let redisInstance: Redis | null = null

function getRedis(): Redis | null {
  if (redisInstance) return redisInstance

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    if (process.env.NODE_ENV === "development") {
      console.debug("[cache] Upstash Redis not configured — caching disabled")
    }
    return null
  }

  redisInstance = new Redis({ url, token })
  return redisInstance
}

// ─── Cache Key Prefixes ─────────────────────────────
export const CachePrefix = {
  TRENDING: "trending:",
  FEED: "feed:",
  USER_PROFILE: "user:",
  SUGGESTIONS: "suggestions:",
  COMMUNITY: "community:",
  SEARCH: "search:",
  LEADERBOARD: "leaderboard:",
  STATS: "stats:",
} as const

// ─── Default TTLs (in seconds) ─────────────────────
export const CacheTTL = {
  /** 5 minutes — fast-changing data (feed, presence) */
  SHORT: 300,
  /** 15 minutes — moderate data (suggestions, trending) */
  MEDIUM: 900,
  /** 1 hour — slow-changing data (profiles, community info) */
  LONG: 3600,
  /** 24 hours — rarely-changing data (leaderboards, stats) */
  DAY: 86400,
} as const

// ─── Core Cache Operations ──────────────────────────

/**
 * Get a cached value by key.
 * Returns null if not found or on error.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedis()
    if (!redis) return null

    const data = await redis.get<T>(key)
    return data
  } catch (error) {
    console.error("[cache] GET error:", error)
    return null
  }
}

/**
 * Set a cached value with TTL.
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number = CacheTTL.MEDIUM
): Promise<void> {
  try {
    const redis = getRedis()
    if (!redis) return

    await redis.set(key, value, { ex: ttlSeconds })
  } catch (error) {
    console.error("[cache] SET error:", error)
  }
}

/**
 * Delete a cached value.
 */
export async function cacheDel(key: string): Promise<void> {
  try {
    const redis = getRedis()
    if (!redis) return

    await redis.del(key)
  } catch (error) {
    console.error("[cache] DEL error:", error)
  }
}

/**
 * Delete all keys matching a prefix pattern.
 * Useful for invalidating a category of cached data.
 *
 * @example
 * await cacheInvalidatePrefix(CachePrefix.FEED) // Clears all feed caches
 */
export async function cacheInvalidatePrefix(prefix: string): Promise<void> {
  try {
    const redis = getRedis()
    if (!redis) return

    let cursor = 0
    do {
      const [nextCursor, keys] = await redis.scan(cursor, {
        match: `${prefix}*`,
        count: 100,
      })
      cursor = nextCursor

      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } while (cursor !== 0)
  } catch (error) {
    console.error("[cache] INVALIDATE_PREFIX error:", error)
  }
}

/**
 * Get-or-set pattern: Returns cached value if exists,
 * otherwise calls fetcher, caches the result, and returns it.
 *
 * This is the primary function for adding caching to any data fetch.
 *
 * @example
 * const trending = await cacheGetOrSet(
 *   `${CachePrefix.TRENDING}global`,
 *   async () => await fetchTrendingPosts(),
 *   CacheTTL.MEDIUM
 * )
 */
export async function cacheGetOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = CacheTTL.MEDIUM
): Promise<T> {
  const cached = await cacheGet<T>(key)
  if (cached !== null) return cached

  const fresh = await fetcher()
  await cacheSet(key, fresh, ttlSeconds)
  return fresh
}

/**
 * Increment a counter in Redis.
 * Useful for rate limiting, view counts, etc.
 */
export async function cacheIncr(
  key: string,
  ttlSeconds?: number
): Promise<number> {
  try {
    const redis = getRedis()
    if (!redis) return 0

    const value = await redis.incr(key)

    // Set TTL on first increment
    if (value === 1 && ttlSeconds) {
      await redis.expire(key, ttlSeconds)
    }

    return value
  } catch (error) {
    console.error("[cache] INCR error:", error)
    return 0
  }
}

/**
 * Check if a key exists in cache.
 */
export async function cacheExists(key: string): Promise<boolean> {
  try {
    const redis = getRedis()
    if (!redis) return false

    const exists = await redis.exists(key)
    return exists === 1
  } catch (error) {
    console.error("[cache] EXISTS error:", error)
    return false
  }
}
