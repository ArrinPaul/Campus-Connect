import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { unfollowUser } from "@/server/db/follows"

// DELETE /api/follows/unfollow  body: { userId }
export async function DELETE(req: Request) {
  try {
    const { userId: authId } = await auth()
    if (!authId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

    await unfollowUser(authId, userId)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

