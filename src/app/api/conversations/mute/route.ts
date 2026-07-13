import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { toggleMute } from "@/server/db/messages"

// POST /api/conversations/mute  body: { conversationId, muted }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { conversationId, muted } = await req.json()
    if (!conversationId) return NextResponse.json({ error: "conversationId required" }, { status: 400 })

    await toggleMute(conversationId, userId, muted ?? true)
    return NextResponse.json({ success: true })
  } catch (err) {
    return internalError(err)
  }
}