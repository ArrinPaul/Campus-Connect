import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getLeaderboard } from "@/server/db/gamification"

// GET /api/leaderboard?period=weekly|monthly|all-time&university=...&limit=50&offset=0
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const rawPeriod = searchParams.get("period") || "all-time"
    const period = ["weekly", "monthly", "all-time"].includes(rawPeriod)
      ? (rawPeriod as "weekly" | "monthly" | "all-time")
      : "all-time"

    const university = searchParams.get("university") || undefined
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50))
    const offset = Math.max(0, Number(searchParams.get("offset")) || 0)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const viewerId = user?.id

    const leaderboard = await getLeaderboard({
      period,
      university,
      limit,
      offset,
      currentUserId: viewerId,
    })

    return NextResponse.json(leaderboard)
  } catch (err) {
    return internalError(err)
  }
}
