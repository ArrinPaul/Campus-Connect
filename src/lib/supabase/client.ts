import { createBrowserClient } from "@supabase/ssr"

/**
 * Supabase client for browser (client components).
 * Uses Next.js cookies for auth session persistence.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
