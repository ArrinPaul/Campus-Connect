import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getReplies } from "@/server/db/comments"

// GET /api/comments/replies?commentId=...&limit=20&offset=0
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const commentId = searchParams.get("commentId") || searchParams.get("id")
    if (!commentId) return NextResponse.json({ error: "commentId required" }, { status: 400 })

    const limit = parseInt(searchParams.get("limit") ?? "20")
    const offset = parseInt(searchParams.get("offset") ?? "0")

    const replies = await getReplies(commentId, limit, offset)
    return NextResponse.json({ replies, hasMore: replies.length === limit })
  } catch (err) {
    return internalError(err)
  }
}
