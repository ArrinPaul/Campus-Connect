/**
 * Edge-compatible in-memory rate limiter.
 *
 * Best-effort protection for single-instance deployments.
 * For production at scale, swap the store with Upstash Redis:
 *   import { Ratelimit } from "@upstash/ratelimit"
 *   import { Redis } from "@upstash/redis"
 */

export const RATE_LIMITS = {
  default: { limit: 100, windowMs: 60_000 },  // 100 req/min general
  api:     { limit: 60,  windowMs: 60_000 },  // 60 req/min for API routes
  auth:    { limit: 10,  windowMs: 60_000 },  // 10 req/min for auth pages
} as const

export type RouteType = keyof typeof RATE_LIMITS

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  /** Unix timestamp (seconds) when the window resets */
  reset: number
}

export interface RateLimitEntry {
  count: number
  windowStart: number
}

/**
 * Creates an isolated rate-limit store.
 * Use createRateLimiter() to get a testable instance with its own state.
 */
export function createRateLimiter(limits = RATE_LIMITS) {
  const store = new Map<string, RateLimitEntry>()
  let lastCleanup = Date.now()

  function cleanup(): void {
    const now = Date.now()
    if (now - lastCleanup < 60_000) return
    lastCleanup = now
    for (const [key, entry] of Array.from(store.entries())) {
      if (now - entry.windowStart > 120_000) store.delete(key)
    }
  }

  function check(ip: string, routeType: RouteType = "default"): RateLimitResult {
    cleanup()
    const { limit, windowMs } = limits[routeType]
    const now = Date.now()
    const key = `${ip}:${routeType}`
    const entry = store.get(key)

    if (!entry || now - entry.windowStart >= windowMs) {
      store.set(key, { count: 1, windowStart: now })
      return {
        allowed: true,
        limit,
        remaining: limit - 1,
        reset: Math.ceil((now + windowMs) / 1000),
      }
    }

    const reset = Math.ceil((entry.windowStart + windowMs) / 1000)

    if (entry.count >= limit) {
      return { allowed: false, limit, remaining: 0, reset }
    }

    store.set(key, { count: entry.count + 1, windowStart: entry.windowStart })
    return {
      allowed: true,
      limit,
      remaining: limit - entry.count - 1,
      reset,
    }
  }

  return { check, store }
}

// Singleton rate limiter for use in middleware
export const rateLimiter = createRateLimiter()

/** Convenience alias — check rate limit against the singleton store */
export const checkRateLimit = (ip: string, routeType: RouteType = "default"): RateLimitResult =>
  rateLimiter.check(ip, routeType)
