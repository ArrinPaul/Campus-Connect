import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { updatePost } from "@/server/db/posts"

// PATCH /api/posts/update  body: { postId, content }
export async function PATCH(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { postId, content } = await req.json()
    if (!postId || !content) return NextResponse.json({ error: "postId and content required" }, { status: 400 })

    const post = await updatePost(postId, content)
    return NextResponse.json(post)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
