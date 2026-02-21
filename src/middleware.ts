import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { checkRateLimit, checkRateLimitAuto } from "@/lib/rate-limit"
import type { RouteType } from "@/lib/rate-limit"

// ─── Route Matchers ───────────────────────────────────────────────────────────

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
])

const isAuthRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"])
const isApiRoute  = createRouteMatcher(["/api/(.*)"])

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  )
}

// ─── Middleware ────────────────────────────────────────────────────────────────

export default clerkMiddleware(async (auth, request) => {
  const ip = getClientIp(request)
  const routeType: RouteType = isAuthRoute(request) ? "auth" : isApiRoute(request) ? "api" : "default"
  const { allowed, limit, remaining, reset } = await checkRateLimitAuto(ip, routeType)

  if (!allowed) {
    return NextResponse.json(
      {
        error: "Too Many Requests",
        message: "Rate limit exceeded. Please slow down and try again shortly.",
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(reset),
          "Retry-After": String(reset - Math.floor(Date.now() / 1000)),
          "Content-Type": "application/json",
        },
      }
    )
  }

  // Protect all non-public routes via Clerk
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}


