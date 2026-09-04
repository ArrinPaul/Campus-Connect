import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getReactionCounts } from "@/server/db/reactions"

// GET /api/reactions/counts?targetId=...&targetType=post
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const targetId = searchParams.get("targetId") || searchParams.get("id")
    const targetType = searchParams.get("targetType") ?? "post"
    if (!targetId) return NextResponse.json({ error: "targetId required" }, { status: 400 })

    const counts = await getReactionCounts(targetId, targetType)
    return NextResponse.json({ counts })
  } catch (err) {
    return internalError(err)
  }
}
