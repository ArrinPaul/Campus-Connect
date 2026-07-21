import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { deletePost } from "@/server/db/posts"

// DELETE /api/posts/delete  body: { postId }
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { postId } = await req.json()
    if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 })

    const success = await deletePost(postId, userId)
    if (!success) {
      return NextResponse.json({ error: "Forbidden: You can only delete your own posts" }, { status: 403 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    return internalError(err)
  }
}
