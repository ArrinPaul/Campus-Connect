import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { promoteToAdmin, demoteFromAdmin } from "@/server/db/messages"

// POST /api/conversations/admin  body: { conversationId, userId } — promote to admin
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const actingUserId = user?.id
    if (!actingUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { conversationId, userId } = await req.json()
    if (!conversationId || !userId) {
      return NextResponse.json({ error: "conversationId and userId required" }, { status: 400 })
    }

    const result = await promoteToAdmin(conversationId, userId, actingUserId)
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status })
    return NextResponse.json(result)
  } catch (err) {
    return internalError(err)
  }
}

// DELETE /api/conversations/admin  body: { conversationId, userId } — demote from admin
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const actingUserId = user?.id
    if (!actingUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { conversationId, userId } = await req.json()
    if (!conversationId || !userId) {
      return NextResponse.json({ error: "conversationId and userId required" }, { status: 400 })
    }

    const result = await demoteFromAdmin(conversationId, userId, actingUserId)
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status })
    return NextResponse.json(result)
  } catch (err) {
    return internalError(err)
  }
}
