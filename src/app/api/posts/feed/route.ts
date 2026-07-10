import { auth } from "@/lib/auth/client"
import { NextResponse } from "next/server"
import { getFeedPosts } from "@/server/db/posts"

// GET /api/posts/feed?limit=10&offset=0
export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ posts: [], hasMore: false })

    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get("limit") ?? "20")
    const offset = parseInt(url.searchParams.get("offset") ?? "0")

    const posts = await getFeedPosts(userId, limit, offset)
    return NextResponse.json({ posts, hasMore: posts.length === limit })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
