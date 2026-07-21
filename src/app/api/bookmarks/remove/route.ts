import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { removeBookmark } from "@/server/db/bookmarks"

// DELETE /api/bookmarks/remove  body: { postId }
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { postId } = body
    if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 })

    await removeBookmark(userId, postId)
    return NextResponse.json({ success: true })
  } catch (err) {
    return internalError(err)
  }
}
