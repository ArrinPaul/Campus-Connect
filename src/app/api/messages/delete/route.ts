import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { deleteMessage } from "@/server/db/messages"

// DELETE /api/messages/delete  body: { messageId }
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { messageId } = await req.json()
    if (!messageId) return NextResponse.json({ error: "messageId required" }, { status: 400 })

    await deleteMessage(messageId)
    return NextResponse.json({ success: true })
  } catch (err) {
    return internalError(err)
  }
}
