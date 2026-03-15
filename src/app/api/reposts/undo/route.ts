import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { undoRepost } from "@/server/db/misc"
import { requireDbUser } from "@/server/db/client"

// DELETE /api/reposts/undo  body: { postId }
export async function DELETE(req: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { postId } = await req.json()
    if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 })

    const me = await requireDbUser(clerkId)
    await undoRepost(postId, me.id as string)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
