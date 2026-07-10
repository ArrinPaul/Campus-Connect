import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { getPostComments, createComment } from "@/server/db/comments"

// GET /api/comments?postId=xxx&limit=20&cursor=xxx
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const postId = url.searchParams.get("postId")
    if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 })

    const limit = parseInt(url.searchParams.get("limit") ?? "20")
    const offset = parseInt(url.searchParams.get("offset") ?? "0")

    const result = await getPostComments(postId, limit, offset)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// POST /api/comments  body: { postId, content, parentCommentId? }
export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    if (!body.postId || !body.content) return NextResponse.json({ error: "postId and content required" }, { status: 400 })

    const comment = await createComment({
      post_id: body.postId,
      author_id: userId,
      content: body.content,
      parent_id: body.parentCommentId,
    })
    return NextResponse.json(comment, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
