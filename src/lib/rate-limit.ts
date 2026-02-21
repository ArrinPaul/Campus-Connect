import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

/**
 * Rate limiting middleware using Upstash Redis.
 *
 * Provides multiple rate limiter instances for different actions
 * with configurable windows and limits.
 *
 * Requires env vars:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

// Lazy singleton Redis instance
let redis: Redis | null = null

function getRedis(): Redis | null {
  if (redis) return redis

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) return null

  redis = new Redis({ url, token })
  return redis
}

// ─── Rate Limiter Configurations ────────────────────

type RateLimiterName =
  | "api"
  | "auth"
  | "post"
  | "message"
  | "search"
  | "upload"

interface RateLimiterConfig {
  /** Maximum requests allowed in the window */
  limit: number
  /** Time window in seconds */
  window: string
  /** Prefix for Redis keys */
  prefix: string
}

const RATE_LIMITERS: Record<RateLimiterName, RateLimiterConfig> = {
  /** General API requests: 100 per minute */
  api: { limit: 100, window: "1 m", prefix: "rl:api" },
  /** Auth attempts: 5 per minute (prevent brute force) */
  auth: { limit: 5, window: "1 m", prefix: "rl:auth" },
  /** Post creation: 10 per minute */
  post: { limit: 10, window: "1 m", prefix: "rl:post" },
  /** Message sending: 30 per minute */
  message: { limit: 30, window: "1 m", prefix: "rl:msg" },
  /** Search queries: 30 per minute */
  search: { limit: 30, window: "1 m", prefix: "rl:search" },
  /** File uploads: 5 per minute */
  upload: { limit: 5, window: "1 m", prefix: "rl:upload" },
}

// Cache of Ratelimit instances
const limiterCache = new Map<RateLimiterName, Ratelimit>()

function getLimiter(name: RateLimiterName): Ratelimit | null {
  const cached = limiterCache.get(name)
  if (cached) return cached

  const redisClient = getRedis()
  if (!redisClient) return null

  const config = RATE_LIMITERS[name]
  const limiter = new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(config.limit, config.window),
    prefix: config.prefix,
    analytics: true,
  })

  limiterCache.set(name, limiter)
  return limiter
}

// ─── Rate Limit Result ──────────────────────────────

export interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean
  /** Maximum number of requests allowed */
  limit: number
  /** Remaining requests in current window */
  remaining: number
  /** Unix timestamp (ms) when the window resets */
  reset: number
}

// ─── Public API ─────────────────────────────────────

/**
 * Check rate limit for an identifier (typically userId or IP).
 *
 * @param name - The rate limiter to use (api, auth, post, message, search, upload)
 * @param identifier - Unique identifier (userId, IP address, etc.)
 * @returns RateLimitResult with success status and limit metadata
 *
 * @example
 * const result = await checkRateLimit("post", userId)
 * if (!result.success) {
 *   return new Response("Too many requests", { status: 429 })
 * }
 */
export async function checkRateLimit(
  name: RateLimiterName,
  identifier: string
): Promise<RateLimitResult> {
  try {
    const limiter = getLimiter(name)
    if (!limiter) {
      // If Redis is not configured, allow all requests
      return { success: true, limit: 0, remaining: 0, reset: 0 }
    }

    const result = await limiter.limit(identifier)
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    }
  } catch (error) {
    console.error(`[rate-limit] Error checking ${name}:`, error)
    // Fail open — allow the request if Redis errors
    return { success: true, limit: 0, remaining: 0, reset: 0 }
  }
}

/**
 * Get rate limit headers for HTTP responses.
 * Attach these to API route responses for client visibility.
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.reset.toString(),
  }
}

/**
 * Higher-order function to wrap an API handler with rate limiting.
 *
 * @example
 * export const POST = withRateLimit("post", async (req) => {
 *   // handler logic
 * })
 */
export function withRateLimit(
  name: RateLimiterName,
  handler: (req: Request) => Promise<Response>,
  getIdentifier?: (req: Request) => string
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    const identifier =
      getIdentifier?.(req) ??
      req.headers.get("x-forwarded-for") ??
      req.headers.get("x-real-ip") ??
      "anonymous"

    const result = await checkRateLimit(name, identifier)

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: "Too many requests",
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": Math.ceil(
              (result.reset - Date.now()) / 1000
            ).toString(),
            ...getRateLimitHeaders(result),
          },
        }
      )
    }

    const response = await handler(req)

    // Add rate limit headers to successful responses
    const headers = new Headers(response.headers)
    Object.entries(getRateLimitHeaders(result)).forEach(([key, value]) => {
      headers.set(key, value)
    })

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  }
}
