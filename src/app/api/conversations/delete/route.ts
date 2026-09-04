import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { deleteConversationForUser } from "@/server/db/messages"

// DELETE /api/conversations/delete  body: { conversationId }
// Removes the calling user from the conversation (leaves it) rather than
// deleting it for every participant.
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { conversationId } = await req.json().catch(() => ({}))
    if (!conversationId) return NextResponse.json({ error: "conversationId required" }, { status: 400 })

    const result = await deleteConversationForUser(conversationId, userId)
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json(result)
  } catch (err) {
    return internalError(err)
  }
}
