import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { getMessages, sendMessage } from "@/server/db/messages"

// GET /api/messages?conversationId=...&limit=...&cursor=...
export async function GET(req: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get("conversationId")
    if (!conversationId) return NextResponse.json({ error: "conversationId required" }, { status: 400 })

    const limit = Number(searchParams.get("limit") ?? "50")
    const cursor = searchParams.get("cursor") ?? undefined

    const result = await getMessages(clerkId, conversationId, limit, cursor)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// POST /api/messages  body: { conversationId, content, mediaUrls? }
export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { conversationId, content, mediaUrls } = await req.json()
    if (!conversationId || !content) {
      return NextResponse.json({ error: "conversationId and content required" }, { status: 400 })
    }

    const message = await sendMessage(clerkId, {
      conversationId,
      content,
      attachmentUrl: Array.isArray(mediaUrls) ? mediaUrls[0] : undefined,
    })
    return NextResponse.json(message)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
