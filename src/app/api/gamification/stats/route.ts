import { auth } from "@/lib/auth/client"
import { NextResponse } from "next/server"
import { getUserStats } from "@/server/db/misc"

// GET /api/gamification/stats?userId=...
export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const targetUserId = searchParams.get("userId") ?? userId

    const stats = await getUserStats(targetUserId)
    return NextResponse.json(stats)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
