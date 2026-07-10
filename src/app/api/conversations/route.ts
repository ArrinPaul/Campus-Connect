import { auth } from "@/lib/auth/client"
import { NextResponse } from "next/server"
import { getConversations, getOrCreateDMConversation, createGroupConversation } from "@/server/db/messages"

// GET /api/conversations
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const conversations = await getConversations(userId)
    return NextResponse.json(conversations)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// POST /api/conversations  body: { participantId } for DM or { name, participantIds } for group
export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()

    let conversation
    if (body.participantId) {
      conversation = await getOrCreateDMConversation(userId, body.participantId)
    } else if (body.name && body.participantIds) {
      conversation = await createGroupConversation({
        name: body.name,
        createdBy: userId,
        participantIds: body.participantIds,
      })
    } else {
      return NextResponse.json({ error: "participantId or name+participantIds required" }, { status: 400 })
    }

    return NextResponse.json(conversation)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

