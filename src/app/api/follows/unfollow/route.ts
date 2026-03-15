import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { unfollowUser } from "@/server/db/follows"

// DELETE /api/follows/unfollow  body: { userId }
export async function DELETE(req: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

    await unfollowUser(clerkId, userId)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
