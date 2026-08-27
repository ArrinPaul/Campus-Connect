import { NextResponse } from "next/server"
import { createLogger } from "@/lib/logger"

const log = createLogger("RateLimiter")

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

export interface RateLimiterProvider {
  readonly name: string
  limit(identifier: string, limitCount?: number, windowMs?: number): Promise<RateLimitResult>
  reset(identifier: string): Promise<void>
}

// ─── Memory Rate Limiter (Dev, Test & Single-Node Fallback) ───────────────────

interface MemoryEntry {
  count: number
  resetAt: number
}

export class MemoryRateLimiter implements RateLimiterProvider {
  readonly name = "memory"
  private store = new Map<string, MemoryEntry>()

  async limit(identifier: string, limitCount = 60, windowMs = 60000): Promise<RateLimitResult> {
    const now = Date.now()
    const entry = this.store.get(identifier)

    if (!entry || now > entry.resetAt) {
      const newEntry: MemoryEntry = {
        count: 1,
        resetAt: now + windowMs,
      }
      this.store.set(identifier, newEntry)
      return {
        success: true,
        limit: limitCount,
        remaining: limitCount - 1,
        reset: newEntry.resetAt,
      }
    }

    if (entry.count >= limitCount) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
      return {
        success: false,
        limit: limitCount,
        remaining: 0,
        reset: entry.resetAt,
        retryAfter,
      }
    }

    entry.count++
    return {
      success: true,
      limit: limitCount,
      remaining: Math.max(0, limitCount - entry.count),
      reset: entry.resetAt,
    }
  }

  async reset(identifier: string): Promise<void> {
    this.store.delete(identifier)
  }
}

// ─── Redis Rate Limiter (Multi-Instance Production) ──────────────────────────

export class UpstashRedisRateLimiter implements RateLimiterProvider {
  readonly name = "redis"
  private memoryFallback = new MemoryRateLimiter()

  async limit(identifier: string, limitCount = 60, windowMs = 60000): Promise<RateLimitResult> {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!url || !token) {
      // In production without Redis configured, warn loudly and use local memory
      if (process.env.NODE_ENV === "production") {
        log.warn("Upstash Redis not configured; distributed rate limiting fell back to local memory store")
      }
      return this.memoryFallback.limit(identifier, limitCount, windowMs)
    }

    try {
      const { Redis } = await import("@upstash/redis")
      const { Ratelimit } = await import("@upstash/ratelimit")

      const redis = new Redis({ url, token })
      const windowSeconds = Math.max(1, Math.round(windowMs / 1000))

      const ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limitCount, `${windowSeconds} s` as any),
        analytics: true,
      })

      const res = await ratelimit.limit(identifier)
      return {
        success: res.success,
        limit: res.limit,
        remaining: res.remaining,
        reset: res.reset,
        retryAfter: res.success ? undefined : Math.max(1, Math.ceil((res.reset - Date.now()) / 1000)),
      }
    } catch (err: any) {
      log.error("Redis rate limiter error, using memory fallback", { error: err.message })
      return this.memoryFallback.limit(identifier, limitCount, windowMs)
    }
  }

  async reset(identifier: string): Promise<void> {
    await this.memoryFallback.reset(identifier)
  }
}

// ─── Provider Factory ─────────────────────────────────────────────────────────

let globalLimiter: RateLimiterProvider | null = null

export function getRateLimiter(): RateLimiterProvider {
  if (globalLimiter) return globalLimiter

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    globalLimiter = new UpstashRedisRateLimiter()
  } else {
    globalLimiter = new MemoryRateLimiter()
  }

  return globalLimiter
}

// ─── Middleware / Endpoint Helper ─────────────────────────────────────────────

export async function rateLimit(
  req: Request,
  options?: {
    limit?: number
    windowMs?: number
    keyPrefix?: string
    identifier?: string
  }
): Promise<NextResponse | null> {
  const limitCount = options?.limit ?? 60
  const windowMs = options?.windowMs ?? 60000
  const prefix = options?.keyPrefix ?? "rl"

  // Derive identifier: custom identifier or client IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1"

  const id = options?.identifier || `${prefix}:${ip}`

  const limiter = getRateLimiter()
  const result = await limiter.limit(id, limitCount, windowMs)

  if (!result.success) {
    log.warn("Rate limit exceeded", { identifier: id, retryAfter: result.retryAfter })
    return NextResponse.json(
      {
        error: "Too many requests. Please slow down.",
        retryAfter: result.retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(result.retryAfter || 60),
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": String(result.remaining),
          "X-RateLimit-Reset": String(result.reset),
        },
      }
    )
  }

  return null
}
