import "server-only"

import { Redis } from "@upstash/redis"

const hasUpstashConfig =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN

const memoryCache = new Map<string, { expiresAt: number; value: unknown }>()
const redis = hasUpstashConfig ? Redis.fromEnv() : null

function nowMs() {
  return Date.now()
}

export async function getJson<T>(key: string): Promise<T | null> {
  if (redis) {
    const value = await redis.get<T>(key)
    return value ?? null
  }

  const entry = memoryCache.get(key)
  if (!entry) return null

  if (entry.expiresAt <= nowMs()) {
    memoryCache.delete(key)
    return null
  }

  return entry.value as T
}

export async function setJson<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  if (redis) {
    await redis.set(key, value, { ex: ttlSeconds })
    return
  }

  memoryCache.set(key, {
    expiresAt: nowMs() + ttlSeconds * 1000,
    value,
  })
}

export async function delKey(key: string): Promise<void> {
  if (redis) {
    await redis.del(key)
    return
  }

  memoryCache.delete(key)
}
