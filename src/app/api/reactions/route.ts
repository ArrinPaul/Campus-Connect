import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { addReaction, removeReaction, getUserReaction, getReactionCounts } from "@/server/db/reactions"

// POST /api/reactions  body: { targetId, targetType, type }
export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { targetId, targetType, type } = await req.json()
    if (!targetId || !targetType || !type) {
      return NextResponse.json({ error: "targetId, targetType, type required" }, { status: 400 })
    }

    const result = await addReaction(userId, targetId, targetType, type)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// GET /api/reactions?targetId=xxx&targetType=post
export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    const url = new URL(req.url)
    const targetId = url.searchParams.get("targetId")
    const targetType = url.searchParams.get("targetType") as "post" | "comment"

    if (!targetId || !targetType) {
      return NextResponse.json({ error: "targetId and targetType required" }, { status: 400 })
    }

    const [counts, userReaction] = await Promise.all([
      getReactionCounts(targetId, targetType),
      userId ? getUserReaction(userId, targetId, targetType) : Promise.resolve(null),
    ])

    return NextResponse.json({ counts, userReaction })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
