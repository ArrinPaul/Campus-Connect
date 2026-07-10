import { auth } from "@/lib/auth/client"
import { NextResponse } from "next/server"
import { toggleMute } from "@/server/db/messages"

// POST /api/conversations/mute  body: { conversationId, muted }
export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { conversationId, muted } = await req.json()
    if (!conversationId) return NextResponse.json({ error: "conversationId required" }, { status: 400 })

    await toggleMute(conversationId, userId, muted ?? true)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}