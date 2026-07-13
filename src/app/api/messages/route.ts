import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getMessages, sendMessage } from "@/server/db/messages"

// GET /api/messages?conversationId=...&limit=...&cursor=...
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get("conversationId")
    if (!conversationId) return NextResponse.json({ error: "conversationId required" }, { status: 400 })

    const limit = Number(searchParams.get("limit") ?? "50")
    const offset = Number(searchParams.get("cursor") ?? "0")

    const result = await getMessages(conversationId, limit, offset)
    return NextResponse.json(result)
  } catch (err) {
    return internalError(err)
  }
}

// POST /api/messages  body: { conversationId, content, mediaUrls? }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { conversationId, content, mediaUrls } = await req.json()
    if (!conversationId || !content) {
      return NextResponse.json({ error: "conversationId and content required" }, { status: 400 })
    }

    const message = await sendMessage({
      conversation_id: conversationId,
      sender_id: userId,
      content,
    })
    return NextResponse.json(message)
  } catch (err) {
    return internalError(err)
  }
}
