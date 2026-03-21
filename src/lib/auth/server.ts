import type { NextRequest } from "next/server"
import { cookies, headers } from "next/headers"

function getFallbackUserId(): string | null {
  const value = process.env.DEV_USER_ID
  return value && value.trim().length > 0 ? value.trim() : null
}

function fromRequest(request: NextRequest): string | null {
  const headerUserId = request.headers.get("x-user-id")
  const cookieUserId = request.cookies.get("cc_user_id")?.value
  return headerUserId || cookieUserId || getFallbackUserId()
}

export async function auth(): Promise<{ userId: string | null }> {
  try {
    const h = await headers()
    const c = await cookies()
    const userId = h.get("x-user-id") || c.get("cc_user_id")?.value || getFallbackUserId()
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

export const clerkMiddleware = authMiddleware
