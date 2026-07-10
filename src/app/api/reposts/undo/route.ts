import { auth } from "@/lib/auth/client"
import { NextResponse } from "next/server"
import { undoRepost } from "@/server/db/misc"

// DELETE /api/reposts/undo  body: { postId }
export async function DELETE(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { postId } = await req.json()
    if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 })

    await undoRepost(postId, userId)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
