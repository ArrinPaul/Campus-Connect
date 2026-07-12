import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { removeReaction } from "@/server/db/reactions"

// DELETE /api/reactions/remove  body: { targetId, targetType }
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { targetId, targetType } = await req.json()
    if (!targetId || !targetType) return NextResponse.json({ error: "targetId and targetType required" }, { status: 400 })

    await removeReaction(userId, targetId, targetType)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
