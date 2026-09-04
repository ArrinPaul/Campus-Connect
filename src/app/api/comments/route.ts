import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { parseBody } from "@/lib/validation"
import { NextResponse } from "next/server"
import { getPostComments, createComment } from "@/server/db/comments"
import { incrementCommentCount } from "@/server/db/posts"
import DOMPurify from "isomorphic-dompurify"
import { z } from "zod"

const createCommentSchema = z.object({
  postId: z.string().uuid(),
  content: z.string().trim().min(1, "Content required").max(2000, "Comment too long"),
  parentCommentId: z.string().uuid().optional(),
})

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
    return internalError(err)
  }
}

// POST /api/comments  body: { postId, content, parentCommentId? }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const parsed = await parseBody(req, createCommentSchema)
    if ("response" in parsed) return parsed.response
    const body = parsed.data

    const sanitizedContent = DOMPurify.sanitize(body.content)

    const comment = await createComment({
      post_id: body.postId,
      author_id: userId,
      content: sanitizedContent,
      parent_id: body.parentCommentId,
    })
    if (!comment) {
      return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
    }

    // Update post count
    incrementCommentCount(body.postId).catch(console.error)

    return NextResponse.json(comment, { status: 201 })
  } catch (err) {
    return internalError(err)
  }
}
