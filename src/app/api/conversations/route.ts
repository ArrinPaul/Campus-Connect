import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { getConversations, getOrCreateDMConversation, createGroupConversation } from "@/server/db/messages"
import { requireDbUser } from "@/server/db/client"

// GET /api/conversations
export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const me = await requireDbUser(clerkId)
    const conversations = await getConversations(me.id as string)
    return NextResponse.json(conversations)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// POST /api/conversations  body: { participantId } for DM or { name, participantIds } for group
export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const me = await requireDbUser(clerkId)
    const body = await req.json()

    let conversation
    if (body.participantId) {
      conversation = await getOrCreateDMConversation(me.id as string, body.participantId)
    } else if (body.name && body.participantIds) {
      conversation = await createGroupConversation(me.id as string, body.name, body.participantIds)
    } else {
      return NextResponse.json({ error: "participantId or name+participantIds required" }, { status: 400 })
    }

    return NextResponse.json(conversation)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
