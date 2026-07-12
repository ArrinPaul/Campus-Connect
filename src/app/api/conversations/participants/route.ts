import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getConversationById, createGroupConversation } from "@/server/db/messages"

// POST /api/conversations/participants  body: { conversationId, userId }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { conversationId, userId: newParticipantId } = await req.json()
    if (!conversationId || !newParticipantId) {
      return NextResponse.json({ error: "conversationId and userId required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("conversation_participants")
      .insert({ conversation_id: conversationId, user_id: newParticipantId })
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// DELETE /api/conversations/participants  body: { conversationId, userId }
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { conversationId, userId: removeUserId } = await req.json()
    if (!conversationId || !removeUserId) {
      return NextResponse.json({ error: "conversationId and userId required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("conversation_participants")
      .delete()
      .eq("conversation_id", conversationId)
      .eq("user_id", removeUserId)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}