import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Initialize Redis and Upstash Rate Limiter (only if environment variables exist)
let ratelimit: Ratelimit | null = null

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    
    // Global rate limit: 120 requests per minute per IP
    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(120, "1 m"),
      analytics: true,
      prefix: "campus_connect_ratelimit",
    })
  } else {
    console.warn("Upstash Redis credentials missing. Falling back to unprotected middleware.")
  }
} catch (error) {
  console.error("Failed to initialize Upstash Rate Limiter:", error)
}

/**
 * Middleware: refreshes Supabase session and protects non-public routes.
 * Also performs Vercel Edge distributed rate limiting on API endpoints to prevent spammers/DDoS.
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // 1. Apply Edge Rate Limiting to API routes
  if (pathname.startsWith("/api/") && ratelimit) {
    // Extract IP from Vercel headers, or fallback to localhost
    const ip = request.ip || request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for") || "127.0.0.1"
    
    try {
      const { success, limit, reset, remaining } = await ratelimit.limit(ip)
      
      if (!success) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { 
            status: 429,
            headers: {
              "X-RateLimit-Limit": limit.toString(),
              "X-RateLimit-Remaining": remaining.toString(),
              "X-RateLimit-Reset": reset.toString(),
              "Retry-After": "60",
              "Access-Control-Allow-Origin": "*"
            }
          }
        )
      }
    } catch (error) {
      console.error("Rate limiter error:", error)
      // Fail open if Redis is down so we don't break the app
    }
  }

  // 2. Auth & Session Management
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
}
