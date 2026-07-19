import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

// In-memory rate limiting tracker (resets per runtime instance scale-out)
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 120 // 120 requests/min

/**
 * Middleware: refreshes Supabase session and protects non-public routes.
 * Also performs lightweight IP-based rate limiting on API endpoints to prevent spammers/DDoS.
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Apply rate limiting to API routes only
  if (pathname.startsWith("/api/")) {
    const ip = request.ip || request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for") || "127.0.0.1"
    const now = Date.now()

    const limitData = ipRequestCounts.get(ip)
    if (!limitData || now > limitData.resetTime) {
      ipRequestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
    } else {
      limitData.count++
      if (limitData.count > MAX_REQUESTS_PER_WINDOW) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { 
            status: 429,
            headers: {
              "Retry-After": "60",
              "Access-Control-Allow-Origin": "*"
            }
          }
        )
      }
    }
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
}
