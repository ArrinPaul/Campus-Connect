import { type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

/**
 * Middleware: refreshes Supabase session and protects non-public routes.
 * Rate limiting handled by Supabase RLS instead of custom code.
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
}
