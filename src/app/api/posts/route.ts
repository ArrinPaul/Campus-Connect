import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { createPost } from "@/server/db/posts"
import DOMPurify from "isomorphic-dompurify"

// POST /api/posts
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    if (!body.content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 })

    const sanitizedContent = DOMPurify.sanitize(body.content)

    const post = await createPost({
      author_id: userId,
      content: sanitizedContent,
      media_urls: body.media_urls,
      media_type: body.media_type,
      community_id: body.community_id,
      poll_id: body.poll_id,
    })
    
    if (!post) {
      return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
    }
    
    return NextResponse.json(post, { status: 201 })
  } catch (err) {
    return internalError(err)
  }
}
