import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { searchPosts } from "@/server/db/misc"

// GET /api/search/posts?q=...&limit=20&offset=0
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q") ?? searchParams.get("query") ?? ""
    if (!query.trim()) return NextResponse.json({ posts: [] })

    const limit = parseInt(searchParams.get("limit") ?? "20")
    const offset = parseInt(searchParams.get("offset") ?? "0")

    const posts = await searchPosts(query, limit, offset)
    return NextResponse.json({ posts, hasMore: posts.length === limit })
  } catch (err) {
    return internalError(err)
  }
}
