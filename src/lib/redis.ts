import { Redis } from "@upstash/redis"

// Upstash Redis Client with in-memory TTL Map fallback for zero latency & offline development
const redisClient = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

// High-speed in-memory TTL Cache fallback when Redis credentials are not configured
const memoryStore = new Map<string, { value: any; expiresAt: number }>()

export async function cacheGet<T = any>(key: string): Promise<T | null> {
  if (redisClient) {
    try {
      const data = await redisClient.get<T>(key)
      if (data !== null && data !== undefined) return data
    } catch {
      // Fall through to memory store if Redis request fails
    }
  }

  const item = memoryStore.get(key)
  if (!item) return null
  if (Date.now() > item.expiresAt) {
    memoryStore.delete(key)
    return null
  }
  return item.value as T
}

export async function cacheSet<T = any>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.set(key, value, { ex: ttlSeconds })
    } catch {
      // Ignore
    }
  }

  memoryStore.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  })
}

export async function cacheDel(key: string): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.del(key)
    } catch {
      // Ignore
    }
  }
  memoryStore.delete(key)
}
