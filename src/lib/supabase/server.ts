import { createServerClient } from "@supabase/ssr"
import { cookies, headers } from "next/headers"

/**
 * Supabase client for server components and route handlers.
 * Reads/writes auth session via Next.js cookies, and falls back to Bearer token.
 */
export async function createClient() {
  const cookieStore = await cookies()
  const headerStore = await headers()
  const authHeader = headerStore.get('Authorization')
  
  const globalHeaders: Record<string, string> = authHeader ? { Authorization: authHeader } : {}

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: globalHeaders
      },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: any[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from Server Component — ignore
          }
        },
      },
    }
  )
}

/**
 * Admin client that bypasses RLS (Row Level Security).
 * Only use this in server environments where you need to perform actions
 * on behalf of other users, like sending notifications.
 */
export function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return [] },
        setAll() { },
      },
    }
  )
}
