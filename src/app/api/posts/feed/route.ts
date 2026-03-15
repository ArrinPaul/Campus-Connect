import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { getFeedPosts } from "@/server/db/posts"

// GET /api/posts/feed?limit=10&cursor=xxx
export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ posts: [], hasMore: false, nextCursor: null })

    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get("limit") ?? "10")
    const cursor = url.searchParams.get("cursor") ?? undefined

    const result = await getFeedPosts(userId, limit, cursor)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
