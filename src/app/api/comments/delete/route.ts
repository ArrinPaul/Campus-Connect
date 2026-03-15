import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { deleteComment } from "@/server/db/comments"

// DELETE /api/comments/delete  body: { commentId }
export async function DELETE(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { commentId } = await req.json()
    if (!commentId) return NextResponse.json({ error: "commentId required" }, { status: 400 })

    await deleteComment(commentId, userId)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
