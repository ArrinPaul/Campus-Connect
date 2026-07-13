import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getUnreadCount } from "@/server/db/messages"

// GET /api/conversations/unread-count?conversationId=...
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get("conversationId")
    if (!conversationId) return NextResponse.json({ error: "conversationId required" }, { status: 400 })

    const count = await getUnreadCount(conversationId, userId)
    return NextResponse.json({ count })
  } catch (err) {
    return internalError(err)
  }
}