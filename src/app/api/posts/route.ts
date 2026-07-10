import { auth } from "@/lib/auth/client"
import { NextResponse } from "next/server"
import { createPost } from "@/server/db/posts"

// POST /api/posts
export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    if (!body.content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 })

    const post = await createPost({
      author_id: userId,
      content: body.content,
      media_urls: body.media_urls,
      media_type: body.media_type,
      community_id: body.community_id,
      poll_id: body.poll_id,
    })
    return NextResponse.json(post, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
