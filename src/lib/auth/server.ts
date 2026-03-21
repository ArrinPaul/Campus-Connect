import type { NextRequest } from "next/server"
import { cookies, headers } from "next/headers"
import { getSessionCookieName, verifySessionToken } from "@/lib/auth/session"

function isDevAuthShimEnabled(): boolean {
  return process.env.ENABLE_DEV_AUTH_SHIM === "true"
}

function getFallbackUserId(): string | null {
  if (!isDevAuthShimEnabled()) return null
  const value = process.env.DEV_USER_ID
  return value && value.trim().length > 0 ? value.trim() : null
}

function readUserIdFromToken(token?: string | null): string | null {
  if (!token) return null
  return verifySessionToken(token)?.userId ?? null
}

function fromRequest(request: NextRequest): string | null {
  const sessionToken = request.cookies.get(getSessionCookieName())?.value
  const tokenUserId = readUserIdFromToken(sessionToken)
  if (tokenUserId) return tokenUserId

  if (isDevAuthShimEnabled()) {
    const headerUserId = request.headers.get("x-user-id")
    const cookieUserId = request.cookies.get("cc_user_id")?.value
    return headerUserId || cookieUserId || getFallbackUserId()
  }

  return null
}

export async function auth(): Promise<{ userId: string | null }> {
  try {
    const c = await cookies()
    const sessionToken = c.get(getSessionCookieName())?.value
    const tokenUserId = readUserIdFromToken(sessionToken)
    if (tokenUserId) return { userId: tokenUserId }

    if (isDevAuthShimEnabled()) {
      const h = await headers()
      const userId = h.get("x-user-id") || c.get("cc_user_id")?.value || getFallbackUserId()
      return { userId }
    }

    const userId = getFallbackUserId()
    return { userId }
  } catch {
    return { userId: getFallbackUserId() }
  }
}

export async function currentUser() {
  const { userId } = await auth()
  if (!userId) return null
  return { id: userId }
}

export function createRouteMatcher(patterns: string[]) {
  const regexes = patterns.map((pattern) => {
    const source = `^${pattern.replace(/\(\.\*\)/g, ".*")}$`
    return new RegExp(source)
  })
  return (request: NextRequest) => {
    const pathname = request.nextUrl.pathname
    return regexes.some((regex) => regex.test(pathname))
  }
}

export function authMiddleware(
  handler: (
    authHelpers: { protect: () => Promise<void>; userId: string | null },
    request: NextRequest
  ) => Promise<Response | void> | Response | void
) {
  return async (request: NextRequest) => {
    const userId = fromRequest(request)
    const result = await handler(
      {
        userId,
        protect: async () => {
          return
        },
      },
      request
    )
    return result
  }
}
