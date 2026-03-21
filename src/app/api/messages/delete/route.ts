import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { deleteMessage } from "@/server/db/messages"
import { requireDbUser } from "@/server/db/client"

// DELETE /api/messages/delete  body: { messageId }
export async function DELETE(req: Request) {
  try {
    const { userId: authId } = await auth()
    if (!authId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { messageId } = await req.json()
    if (!messageId) return NextResponse.json({ error: "messageId required" }, { status: 400 })

    const me = await requireDbUser(authId)
    await deleteMessage(messageId, me.id as string)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
