import { NextResponse } from "next/server"
import { getLeaderboard } from "@/server/db/misc"

// GET /api/gamification/leaderboard?limit=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get("limit") ?? "20")

    const leaderboard = await getLeaderboard(limit)
    return NextResponse.json(leaderboard)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
