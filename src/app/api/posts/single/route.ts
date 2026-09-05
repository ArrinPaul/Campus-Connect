import { NextResponse } from "next/server"
import { internalError } from "@/lib/api-error"
import { getPostById } from "@/server/db/posts"

// GET /api/posts/single?id=xxx
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get("id") ?? url.searchParams.get("postId")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const post = await getPostById(id)
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 })

    // Real DB shape (id, author_id, like_count, created_at as ISO string,
    // etc.) — PostCard consumes this directly, no camelCase conversion.
    const author = (post as any).author ?? null
    return NextResponse.json({ post, author, ...post })
  } catch (err) {
    return internalError(err)
  }
}
