import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { followUser, unfollowUser, isFollowing, getFollowers, getFollowing } from "@/server/db/follows"

// POST /api/follows  body: { userId }
export async function POST(req: Request) {
  try {
    const { userId: authId } = await auth()
    if (!authId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

    await followUser(authId, userId)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// GET /api/follows?check=true&userId=xxx  OR just for compatibility
export async function GET(req: Request) {
  try {
    const { userId: authId } = await auth()
    const url = new URL(req.url)
    const targetUserId = url.searchParams.get("userId")

    if (targetUserId && authId) {
      const following = await isFollowing(authId, targetUserId)
      return NextResponse.json({ isFollowing: following })
    }
    return NextResponse.json({ isFollowing: false })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

