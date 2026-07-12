import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { markAsRead } from "@/server/db/messages"

// POST /api/messages/read  body: { conversationId }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { conversationId } = await req.json()
    if (!conversationId) return NextResponse.json({ error: "conversationId required" }, { status: 400 })

    await markAsRead(conversationId, userId)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}