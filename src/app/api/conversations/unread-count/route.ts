import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getUnreadCount, getConversations } from "@/server/db/messages"

// GET /api/conversations/unread-count?conversationId=...
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get("conversationId") || searchParams.get("id")

    if (!conversationId) {
      const conversations = await getConversations(userId)
      const totalUnread = conversations.reduce((acc: number, c: any) => acc + (c.unreadCount || 0), 0)
      return NextResponse.json({ count: totalUnread, unreadCount: totalUnread })
    }

    const count = await getUnreadCount(conversationId, userId)
    return NextResponse.json({ count, unreadCount: count })
  } catch (err) {
    return internalError(err)
  }
}