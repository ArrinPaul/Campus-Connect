import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { deleteComment } from "@/server/db/comments"

// DELETE /api/comments/delete  body: { commentId }
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { commentId } = await req.json()
    if (!commentId) return NextResponse.json({ error: "commentId required" }, { status: 400 })

    await deleteComment(commentId)
    return NextResponse.json({ success: true })
  } catch (err) {
    return internalError(err)
  }
}
