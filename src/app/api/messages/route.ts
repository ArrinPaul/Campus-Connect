import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getMessages, sendMessage } from "@/server/db/messages"
import { MESSAGE_MAX_LENGTH } from "@/lib/validation-constants"

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

    const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 100)
    const offset = Math.max(Number(searchParams.get("cursor") ?? "0"), 0)

    const result = await getMessages(conversationId, limit, offset)
    return NextResponse.json(result)
  } catch (err) {
    return internalError(err)
  }
}

// POST /api/messages  body: { conversationId, content }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { conversationId, content } = await req.json()
    if (!conversationId || !content) {
      return NextResponse.json({ error: "conversationId and content required" }, { status: 400 })
    }

    if (typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "Content must be a non-empty string" }, { status: 400 })
    }

    if (content.length > MESSAGE_MAX_LENGTH) {
      return NextResponse.json(
        { error: `Content must be ${MESSAGE_MAX_LENGTH} characters or less` },
        { status: 400 }
      )
    }

    const message = await sendMessage({
      conversation_id: conversationId,
      sender_id: userId,
      content: content.trim(),
    })
    return NextResponse.json(message)
  } catch (err) {
    return internalError(err)
  }
}
