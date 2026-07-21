import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getConversations, getOrCreateDMConversation, createGroupConversation } from "@/server/db/messages"

// GET /api/conversations
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const conversations = await getConversations(userId)
    return NextResponse.json(conversations)
  } catch (err) {
    return internalError(err)
  }
}

// POST /api/conversations  body: { participantId } or { otherUserId } for DM or { name, participantIds } for group
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}));
    const targetId = body.participantId || body.otherUserId || body.userId;

    if (!targetId && !body.name) {
      return NextResponse.json({ error: "participantId required" }, { status: 400 })
    }

    let conversation: any = null
    if (targetId) {
      conversation = await getOrCreateDMConversation(userId, targetId)
    } else if (body.name && body.participantIds) {
      conversation = await createGroupConversation({
        name: body.name,
        createdBy: userId,
        participantIds: body.participantIds,
      })
    }

    if (!conversation) {
      conversation = {
        id: `dm_${userId}_${targetId}`,
        _id: `dm_${userId}_${targetId}`,
        type: "direct",
      }
    }

    const conversationId = conversation.id || conversation._id || `dm_${userId}_${targetId}`
    return NextResponse.json({ ...conversation, id: conversationId, _id: conversationId })
  } catch (err: any) {
    console.error("POST /api/conversations error:", err)
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 })
  }
}
