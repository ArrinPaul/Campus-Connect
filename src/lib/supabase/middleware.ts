import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Cache stores { isDeleted, expiresAt } so we correctly distinguish
// deleted vs non-deleted users without hitting the DB every request.
const userStatusCache = new Map<string, { isDeleted: boolean; expiresAt: number }>()

const DELETED_TTL_MS     = 60_000   // 1 minute  — for deleted accounts
const NOT_DELETED_TTL_MS = 300_000  // 5 minutes — for active accounts

/**
 * Public routes — no authentication required.
 */
const PUBLIC_PREFIXES = [
  "/sign-in",
  "/sign-up",
  "/onboarding",
  "/offline",
  "/api/auth",
  "/api/cron",
  "/api/webhooks",
]

function isPublicRoute(pathname: string): boolean {
  if (pathname === "/") return true
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/") || pathname.startsWith(prefix + "?")
  )
}

function isAuthRoute(pathname: string): boolean {
  return pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")
}

/**
 * Core middleware: refreshes Supabase session, enforces auth rules.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const authHeader = request.headers.get("Authorization")
  const globalHeaders: Record<string, string> = authHeader ? { Authorization: authHeader } : {}

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: globalHeaders },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as any)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // ── 1. Unauthenticated → redirect to /sign-in (preserving intended URL) ────
  if (!user && !isPublicRoute(pathname)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const url = request.nextUrl.clone()
    url.pathname = "/sign-in"
    url.searchParams.set("redirect_url", pathname)
    return NextResponse.redirect(url)
  }

  // ── 2. Authenticated user visiting sign-in / sign-up → send to feed ────────
  if (user && isAuthRoute(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = "/feed"
    url.search = ""
    return NextResponse.redirect(url)
  }

  // ── 3. Authenticated user on root "/" → send to feed immediately ────────────
  if (user && pathname === "/") {
    const url = request.nextUrl.clone()
    url.pathname = "/feed"
    return NextResponse.redirect(url)
  }

  // ── 4. Soft-delete check (cached to avoid DB on every request) ──────────────
  if (user) {
    const now = Date.now()
    const cached = userStatusCache.get(user.id)

    let isDeleted = false

    if (cached && now < cached.expiresAt) {
      // Cache is still valid — use it
      isDeleted = cached.isDeleted
    } else {
      // Cache miss or expired — query the DB
      const { data: profile } = await supabase
        .from("users")
        .select("deleted_at")
        .eq("id", user.id)
        .single()

      isDeleted = Boolean(profile?.deleted_at)

      userStatusCache.set(user.id, {
        isDeleted,
        expiresAt: now + (isDeleted ? DELETED_TTL_MS : NOT_DELETED_TTL_MS),
      })
    }

    if (isDeleted) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Account has been deleted" }, { status: 403 })
      }
      const url = request.nextUrl.clone()
      url.pathname = "/sign-in"
      url.search = ""
      url.searchParams.set("error", "deleted")
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
