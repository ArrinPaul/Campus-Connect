import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getUserReaction } from "@/server/db/reactions"

// GET /api/reactions/user?targetId=...&targetType=post
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ reaction: null })

    const { searchParams } = new URL(req.url)
    const targetId = searchParams.get("targetId")
    const targetType = (searchParams.get("targetType") as "post" | "comment") || "post"

    if (!targetId) return NextResponse.json({ reaction: null })

    const reaction = await getUserReaction(userId, targetId, targetType)
    return NextResponse.json({ reaction })
  } catch (err) {
    return internalError(err)
  }
}