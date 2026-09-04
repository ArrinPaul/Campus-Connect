import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { parseBody } from "@/lib/validation"
import { NextResponse } from "next/server"
import { createPost } from "@/server/db/posts"
import DOMPurify from "isomorphic-dompurify"
import { z } from "zod"

const createPostSchema = z.object({
  content: z.string().trim().min(1, "Content required").max(10000, "Content too long"),
  media_urls: z.array(z.string().url()).max(10).optional(),
  media_type: z.string().max(50).optional(),
  community_id: z.string().uuid().optional(),
  poll_id: z.string().uuid().optional(),
})

// POST /api/posts
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const parsed = await parseBody(req, createPostSchema)
    if ("response" in parsed) return parsed.response
    const body = parsed.data

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
