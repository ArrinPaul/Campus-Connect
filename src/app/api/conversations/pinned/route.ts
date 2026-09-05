import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getPinnedMessages } from "@/server/db/messages"

// GET /api/conversations/pinned?conversationId=...
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get("conversationId")
    if (!conversationId) return NextResponse.json({ error: "conversationId required" }, { status: 400 })

    const pinned = await getPinnedMessages(conversationId)
    return NextResponse.json(pinned)
  } catch (err) {
    return internalError(err)
  }
}
