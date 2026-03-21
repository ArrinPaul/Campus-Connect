import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { getUserStats, getLeaderboard } from "@/server/db/misc"
import { requireDbUser } from "@/server/db/client"

// GET /api/gamification/stats?userId=...
export async function GET(req: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    let targetId: string
    if (userId) {
      targetId = userId
    } else {
      const me = await requireDbUser(clerkId)
      targetId = me.id as string
    }

    const stats = await getUserStats(targetId)
    return NextResponse.json(stats)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
