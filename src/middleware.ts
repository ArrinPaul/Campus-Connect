import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { checkRateLimitAuto } from "@/lib/rate-limit"
import type { RouteType } from "@/lib/rate-limit"

// ─── Route Matchers ───────────────────────────────────────────────────────────

function isPublicRoute(request: NextRequest): boolean {
  const pathname = request.nextUrl.pathname
  return (
    pathname === "/" ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/api/webhooks")
  )
}

function isAuthRoute(request: NextRequest): boolean {
  const pathname = request.nextUrl.pathname
  return pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")
}

function isApiRoute(request: NextRequest): boolean {
  return request.nextUrl.pathname.startsWith("/api/")
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  )
}

// ─── Middleware ────────────────────────────────────────────────────────────────

export default async function middleware(request: NextRequest) {
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

  // Protect all non-public routes using local auth markers.
  if (!isPublicRoute(request)) {
    const userId =
      request.headers.get("x-user-id") ||
      request.cookies.get("cc_session")?.value ||
      request.cookies.get("cc_user_id")?.value ||
      process.env.DEV_USER_ID ||
      null

    if (!userId) {
      if (isApiRoute(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const signInUrl = new URL("/sign-in", request.url)
      signInUrl.searchParams.set("redirect_url", request.nextUrl.pathname)
      return NextResponse.redirect(signInUrl)
    }
  }

  const response = NextResponse.next()
  response.headers.set("X-RateLimit-Limit", String(limit))
  response.headers.set("X-RateLimit-Remaining", String(remaining))
  response.headers.set("X-RateLimit-Reset", String(reset))
  return response
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}


