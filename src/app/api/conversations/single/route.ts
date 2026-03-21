import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { getConversationById } from "@/server/db/messages"
import { requireDbUser } from "@/server/db/client"

// GET /api/conversations/single?id=...
export async function GET(req: Request) {
  try {
    const { userId: authId } = await auth()
    if (!authId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const me = await requireDbUser(authId)
    const conversation = await getConversationById(id, me.id as string)
    if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(conversation)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

