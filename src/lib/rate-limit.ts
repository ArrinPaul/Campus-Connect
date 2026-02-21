/**
 * Edge-compatible rate limiter with Upstash Redis support.
 *
 * Two tiers:
 *   1. IP-based rate limiting (applied in middleware to every request)
 *   2. Per-user action limits (posts, comments, DMs, follows)
 *      – Pro users receive higher limits via a whitelist multiplier.
 *
 * When UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars are set,
 * uses Upstash Redis for distributed rate limiting across serverless instances.
 * Falls back to in-memory store for development/testing.
 */

// ─── IP-Based Rate Limits ────────────────────────────────────────────────────

export const RATE_LIMITS = {
  default: { limit: 100, windowMs: 60_000 },  // 100 req/min general
  api:     { limit: 60,  windowMs: 60_000 },  // 60 req/min for API routes
  auth:    { limit: 10,  windowMs: 60_000 },  // 10 req/min for auth pages
} as const

export type RouteType = keyof typeof RATE_LIMITS

// ─── Per-User Action Rate Limits ─────────────────────────────────────────────

export type UserAction = "posts" | "comments" | "dms" | "follows"

/** Standard limits per action per hour */
export const USER_ACTION_LIMITS: Record<UserAction, { limit: number; windowMs: number }> = {
  posts:    { limit: 10,  windowMs: 3_600_000 },  // 10/hr
  comments: { limit: 30,  windowMs: 3_600_000 },  // 30/hr
  dms:      { limit: 50,  windowMs: 3_600_000 },  // 50/hr
  follows:  { limit: 20,  windowMs: 3_600_000 },  // 20/hr
}

/** Multiplier applied to Pro users' action limits */
export const PRO_LIMIT_MULTIPLIER = 3

// ─── Shared Types ────────────────────────────────────────────────────────────

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

// ─── IP Rate Limiter ─────────────────────────────────────────────────────────

/**
 * Creates an isolated IP-based rate-limit store.
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

// Singleton IP rate limiter for use in middleware
export const rateLimiter = createRateLimiter()

/** Convenience alias — check IP rate limit against the singleton store */
export const checkRateLimit = (ip: string, routeType: RouteType = "default"): RateLimitResult =>
  rateLimiter.check(ip, routeType)

// ─── Per-User Action Rate Limiter ────────────────────────────────────────────

/**
 * Creates an isolated per-user action rate limiter.
 *
 * ```ts
 * const limiter = createUserActionLimiter()
 * const result  = limiter.check("user_123", "posts", false)
 * const proPlan = limiter.check("user_456", "posts", true)  // 3× limit
 * ```
 */
export function createUserActionLimiter(
  limits: Record<UserAction, { limit: number; windowMs: number }> = USER_ACTION_LIMITS,
  proMultiplier = PRO_LIMIT_MULTIPLIER,
) {
  const store = new Map<string, RateLimitEntry>()
  let lastCleanup = Date.now()

  function cleanup(): void {
    const now = Date.now()
    // Run cleanup at most once per 5 min (action windows are 1 hr)
    if (now - lastCleanup < 300_000) return
    lastCleanup = now
    for (const [key, entry] of Array.from(store.entries())) {
      // Evict entries older than 2× max window
      if (now - entry.windowStart > 7_200_000) store.delete(key)
    }
  }

  function check(userId: string, action: UserAction, isPro = false): RateLimitResult {
    cleanup()
    const base = limits[action]
    if (!base) {
      return { allowed: true, limit: Infinity, remaining: Infinity, reset: 0 }
    }
    const effectiveLimit = isPro ? base.limit * proMultiplier : base.limit
    const { windowMs } = base
    const now = Date.now()
    const key = `${userId}:${action}`
    const entry = store.get(key)

    if (!entry || now - entry.windowStart >= windowMs) {
      store.set(key, { count: 1, windowStart: now })
      return {
        allowed: true,
        limit: effectiveLimit,
        remaining: effectiveLimit - 1,
        reset: Math.ceil((now + windowMs) / 1000),
      }
    }

    const reset = Math.ceil((entry.windowStart + windowMs) / 1000)

    if (entry.count >= effectiveLimit) {
      return { allowed: false, limit: effectiveLimit, remaining: 0, reset }
    }

    store.set(key, { count: entry.count + 1, windowStart: entry.windowStart })
    return {
      allowed: true,
      limit: effectiveLimit,
      remaining: effectiveLimit - entry.count - 1,
      reset,
    }
  }

  function reset(): void {
    store.clear()
    lastCleanup = Date.now()
  }

  return { check, store, reset }
}

// Singleton per-user action limiter
export const userActionLimiter = createUserActionLimiter()

/** Convenience alias — check per-user action limit */
export const checkUserActionLimit = (
  userId: string,
  action: UserAction,
  isPro = false,
): RateLimitResult => userActionLimiter.check(userId, action, isPro)

// ─── Upstash Redis Rate Limiter ──────────────────────────────────────────────

/**
 * Detects whether Upstash Redis env vars are configured.
 * When true, the Upstash-backed limiter is used in production.
 */
function isUpstashConfigured(): boolean {
  return !!(
    typeof process !== "undefined" &&
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _upstashLimiters: Record<RouteType, any> | null = null

async function getUpstashLimiters(): Promise<Record<RouteType, any>> {
  if (_upstashLimiters) return _upstashLimiters

  // Dynamic import to avoid loading @upstash/* in test/dev environments
  const { Ratelimit } = await import("@upstash/ratelimit")
  const { Redis } = await import("@upstash/redis")

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })

  _upstashLimiters = {
    default: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(RATE_LIMITS.default.limit, "60 s"),
      prefix: "rl:ip:default",
    }),
    api: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(RATE_LIMITS.api.limit, "60 s"),
      prefix: "rl:ip:api",
    }),
    auth: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(RATE_LIMITS.auth.limit, "60 s"),
      prefix: "rl:ip:auth",
    }),
  }

  return _upstashLimiters
}

/**
 * Check rate limit using Upstash Redis (distributed, serverless-safe).
 * Returns the same RateLimitResult shape as the in-memory version.
 */
export async function checkRateLimitRedis(
  ip: string,
  routeType: RouteType = "default",
): Promise<RateLimitResult> {
  const limiters = getUpstashLimiters()
  const { success, limit, remaining, reset } = await limiters[routeType].limit(ip)
  return {
    allowed: success,
    limit,
    remaining,
    reset: Math.ceil(reset / 1000), // Upstash returns ms, convert to seconds
  }
}

/**
 * Smart rate limit check — uses Upstash Redis when configured,
 * falls back to in-memory for dev/test environments.
 *
 * For middleware (sync context), use checkRateLimit() directly.
 * For async contexts, prefer checkRateLimitAuto() which auto-selects.
 */
export async function checkRateLimitAuto(
  ip: string,
  routeType: RouteType = "default",
): Promise<RateLimitResult> {
  if (isUpstashConfigured()) {
    return checkRateLimitRedis(ip, routeType)
  }
  return checkRateLimit(ip, routeType)
}
