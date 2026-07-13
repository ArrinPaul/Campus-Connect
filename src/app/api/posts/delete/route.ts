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

    await deletePost(postId)
    return NextResponse.json({ success: true })
  } catch (err) {
    return internalError(err)
  }
}
