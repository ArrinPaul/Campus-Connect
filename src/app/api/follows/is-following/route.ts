import { auth } from "@/lib/auth/client"
import { NextResponse } from "next/server"
import { isFollowing } from "@/server/db/follows"

// GET /api/follows/is-following?userId=...
export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const targetId = searchParams.get("userId")
    if (!targetId) return NextResponse.json({ error: "userId required" }, { status: 400 })

    const result = await isFollowing(userId, targetId)
    return NextResponse.json({ isFollowing: result })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

