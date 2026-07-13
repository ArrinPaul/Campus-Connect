import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getUserById, searchUsers } from "@/server/db/users"

// GET /api/users/profile?id=xxx  OR  /api/users/search?query=xxx
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const authId = user?.id
    const url = new URL(req.url)
    const id = url.searchParams.get("id")
    const query = url.searchParams.get("query")
    const limit = parseInt(url.searchParams.get("limit") ?? "10")

    if (query) {
      const users = await searchUsers(query, limit, authId ?? undefined)
      return NextResponse.json(users)
    }

    if (!id) return NextResponse.json({ error: "id or query required" }, { status: 400 })

    const dbUser = await getUserById(id)
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 })

    return NextResponse.json(dbUser)
  } catch (err) {
    return internalError(err)
  }
}

