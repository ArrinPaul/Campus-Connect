import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { getUnreadCount } from "@/server/db/notifications"

// GET /api/notifications/unread-count
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const count = await getUnreadCount(userId)
    return NextResponse.json({ count })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
