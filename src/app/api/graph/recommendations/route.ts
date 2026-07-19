import { NextResponse } from "next/server"
import { internalError } from "@/lib/api-error"
import { getExplorePosts } from "@/server/db/posts"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get("limit") ?? "20")
    const offset = parseInt(url.searchParams.get("offset") ?? "0")

    const result = await getExplorePosts(limit, offset)
    return NextResponse.json({ posts: result, hasMore: result.length === limit })
  } catch (err) {
    return internalError(err)
  }
}
