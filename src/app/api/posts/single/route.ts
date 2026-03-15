import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { getPostById } from "@/server/db/posts"

// GET /api/posts/single?id=xxx
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get("id") ?? url.searchParams.get("postId")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const post = await getPostById(id)
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 })

    return NextResponse.json(post)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
