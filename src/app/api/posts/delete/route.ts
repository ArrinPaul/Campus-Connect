import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { deletePost } from "@/server/db/posts"

// DELETE /api/posts/delete  body: { postId }
export async function DELETE(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { postId } = await req.json()
    if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 })

    await deletePost(postId, userId)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
