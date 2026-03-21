import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { leaveConversation } from "@/server/db/messages"
import { requireDbUser } from "@/server/db/client"

// POST /api/conversations/leave  body: { conversationId }
export async function POST(req: Request) {
  try {
    const { userId: authId } = await auth()
    if (!authId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { conversationId } = await req.json()
    if (!conversationId) return NextResponse.json({ error: "conversationId required" }, { status: 400 })

    const me = await requireDbUser(authId)
    await leaveConversation(conversationId, me.id as string)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

