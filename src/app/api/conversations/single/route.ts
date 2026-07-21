import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getConversationById } from "@/server/db/messages"
import { getUserById } from "@/server/db/users"

// GET /api/conversations/single?id=... or ?conversationId=...
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id") || searchParams.get("conversationId")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    let conversation = await getConversationById(id)

    if (!conversation && id.startsWith("dm_")) {
      const parts = id.replace("dm_", "").split("_")
      const otherUserId = parts.find((p) => p !== userId) || parts[1] || parts[0]
      const otherUser = await getUserById(otherUserId).catch(() => null)
      conversation = {
        _id: id,
        id: id,
        type: "direct",
        name: otherUser?.name || "Direct Message",
        otherUser: otherUser ? {
          _id: otherUser.id,
          id: otherUser.id,
          name: otherUser.name,
          profilePicture: otherUser.profile_picture,
          profile_picture: otherUser.profile_picture,
          username: otherUser.username || "",
        } : {
          _id: otherUserId,
          id: otherUserId,
          name: "User",
          username: "",
        },
        participants: [
          { _id: userId, id: userId, name: "You" },
          { _id: otherUserId, id: otherUserId, name: otherUser?.name || "User" }
        ]
      } as any
    }

    if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(conversation)
  } catch (err) {
    return internalError(err)
  }
}
