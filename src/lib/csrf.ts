import { type NextRequest, NextResponse } from "next/server"

/**
 * CSRF Protection Utilities
 *
 * Implements the Synchronizer Token Pattern and Origin verification
 * for protecting custom API routes against Cross-Site Request Forgery.
 *
 * Note: Clerk-authenticated routes already have CSRF protection via
 * Clerk's session tokens. This module is for additional custom API endpoints.
 */

const CSRF_HEADER = "x-csrf-token"
const CSRF_COOKIE = "__csrf"

/**
 * Generate a cryptographically random CSRF token.
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("")
}

/**
 * Validate the Origin/Referer header against allowed origins.
 * Returns true if the request origin is trusted.
 */
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin")
  const referer = request.headers.get("referer")

  // Allow same-origin requests (no Origin header on same-origin navigations)
  if (!origin && !referer) return true

  const requestOrigin = origin || (referer ? new URL(referer).origin : null)
  if (!requestOrigin) return true

  const allowedOrigins = [
    request.nextUrl.origin,
    // Add production domains
    "https://campus-connect.vercel.app",
    "https://www.campus-connect.app",
  ]

  // In development, allow localhost
  if (process.env.NODE_ENV !== "production") {
    allowedOrigins.push("http://localhost:3000", "http://localhost:3001")
  }

  return allowedOrigins.includes(requestOrigin)
}

/**
 * Validate the double-submit cookie CSRF pattern.
 * Compares the CSRF token from the header against the cookie value.
 */
export function validateCsrfToken(request: NextRequest): boolean {
  const headerToken = request.headers.get(CSRF_HEADER)
  const cookieToken = request.cookies.get(CSRF_COOKIE)?.value

  if (!headerToken || !cookieToken) return false

  // Constant-time comparison to prevent timing attacks
  if (headerToken.length !== cookieToken.length) return false

  let mismatch = 0
  for (let i = 0; i < headerToken.length; i++) {
    mismatch |= headerToken.charCodeAt(i) ^ cookieToken.charCodeAt(i)
  }
  return mismatch === 0
}

/**
 * Middleware helper: Check CSRF protection on mutating requests.
 * Safe methods (GET, HEAD, OPTIONS) are allowed through.
 *
 * Use this as part of your middleware chain for custom API routes
 * that are not protected by Clerk.
 *
 * @example
 * // In middleware.ts or an API route:
 * const csrfResult = checkCsrf(request)
 * if (csrfResult) return csrfResult // Returns 403 if CSRF check fails
 */
export function checkCsrf(request: NextRequest): NextResponse | null {
  const safeMethods = ["GET", "HEAD", "OPTIONS"]
  if (safeMethods.includes(request.method)) return null

  // Verify Origin header
  if (!validateOrigin(request)) {
    return NextResponse.json(
      { error: "CSRF validation failed: invalid origin" },
      { status: 403 }
    )
  }

  // For API routes with custom forms (not Clerk-protected),
  // verify the double-submit cookie
  if (request.nextUrl.pathname.startsWith("/api/") && !request.nextUrl.pathname.startsWith("/api/webhooks")) {
    if (!validateCsrfToken(request)) {
      return NextResponse.json(
        { error: "CSRF validation failed: invalid token" },
        { status: 403 }
      )
    }
  }

  return null
}

/**
 * Set a CSRF cookie on the response.
 * Call this when rendering pages that contain forms submitting to custom API routes.
 *
 * @example
 * const response = NextResponse.next()
 * setCsrfCookie(response)
 */
export function setCsrfCookie(response: NextResponse): string {
  const token = generateCsrfToken()
  response.cookies.set(CSRF_COOKIE, token, {
    httpOnly: false, // Client JS needs to read it for the header
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60, // 1 hour
  })
  return token
}
