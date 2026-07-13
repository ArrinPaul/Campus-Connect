import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { addReaction, getUserReaction, getReactionCounts } from "@/server/db/reactions"

// POST /api/reactions  body: { targetId, targetType, type }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { targetId, targetType, type } = await req.json()
    if (!targetId || !targetType || !type) {
      return NextResponse.json({ error: "targetId, targetType, type required" }, { status: 400 })
    }

    const result = await addReaction({
      user_id: userId,
      target_id: targetId,
      target_type: targetType,
      type,
    })
    return NextResponse.json(result)
  } catch (err) {
    return internalError(err)
  }
}

// GET /api/reactions?targetId=xxx&targetType=post
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
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
    return internalError(err)
  }
}
