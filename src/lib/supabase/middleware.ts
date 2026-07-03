import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Supabase middleware client.
 * Updates session cookies on every request and handles auth redirects.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — important for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect non-public routes
  const pathname = request.nextUrl.pathname
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/api/auth")

  if (!isPublicRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/sign-in"
    url.searchParams.set("redirect_url", pathname)
    return NextResponse.redirect(url)
  }

  // Redirect signed-in users away from auth pages
  if (user && (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up"))) {
    const url = request.nextUrl.clone()
    url.pathname = "/feed"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
