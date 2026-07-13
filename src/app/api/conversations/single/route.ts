import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getConversationById } from "@/server/db/messages"

// GET /api/conversations/single?id=...
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const conversation = await getConversationById(id)
    if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(conversation)
  } catch (err) {
    return internalError(err)
  }
}

