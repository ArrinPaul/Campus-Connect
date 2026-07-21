import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { updatePresence, getUserStatuses } from "@/server/db/misc"

// GET /api/presence?userIds=... or ?userId=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userIdsStr = searchParams.get("userIds") || searchParams.get("userId")
    if (!userIdsStr) {
      return NextResponse.json({ isOnline: false, online: false })
    }

    const userIds = userIdsStr.split(",").filter(Boolean)
    const statuses: Record<string, boolean> = (await getUserStatuses(userIds)) as any

    // Handle single userId parameter fallback
    if (searchParams.has("userId") && !searchParams.has("userIds")) {
      const targetId = userIds[0] || ""
      const isOnline = Boolean(statuses[targetId])
      return NextResponse.json({ isOnline, online: isOnline, status: isOnline ? "online" : "offline" })
    }

    return NextResponse.json(statuses)
  } catch (err) {
    return internalError(err)
  }
}

// POST /api/presence  body: { status, lastSeen? }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { status } = body
    await updatePresence(userId, status ?? "online")
    return NextResponse.json({ success: true })
  } catch (err) {
    return internalError(err)
  }
}
