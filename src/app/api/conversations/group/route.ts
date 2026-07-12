import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { createGroupConversation } from "@/server/db/messages"

// POST /api/conversations/group  body: { name, participantIds }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { name, participantIds } = await req.json()
    if (!name || !participantIds?.length) {
      return NextResponse.json({ error: "name and participantIds required" }, { status: 400 })
    }

    const conversation = await createGroupConversation({
      name,
      createdBy: userId,
      participantIds,
    })
    return NextResponse.json(conversation)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}