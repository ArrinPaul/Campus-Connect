import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { isFollowing } from "@/server/db/follows"
import { requireDbUser } from "@/server/db/client"

// GET /api/follows/is-following?userId=...
export async function GET(req: Request) {
  try {
    const { userId: authId } = await auth()
    if (!authId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const targetId = searchParams.get("userId")
    if (!targetId) return NextResponse.json({ error: "userId required" }, { status: 400 })

    const me = await requireDbUser(authId)
    const result = await isFollowing(me.id as string, targetId)
    return NextResponse.json({ isFollowing: result })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

