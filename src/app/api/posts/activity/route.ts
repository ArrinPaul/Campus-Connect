import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getUserPosts } from "@/server/db/posts"

// GET /api/posts/activity?userId=...&limit=20&offset=0
// A user's own post activity, reverse chronological. Defaults to the
// signed-in user when no userId is given.
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId") ?? user?.id
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

    const limit = parseInt(searchParams.get("limit") ?? "20")
    const offset = parseInt(searchParams.get("offset") ?? "0")

    const posts = await getUserPosts(userId, limit, offset)
    return NextResponse.json({ posts, hasMore: posts.length === limit })
  } catch (err) {
    return internalError(err)
  }
}
