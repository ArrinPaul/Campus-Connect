import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { getUnreadCount } from "@/server/db/notifications"
import { requireDbUser } from "@/server/db/client"

// GET /api/notifications/unread-count
export async function GET() {
  try {
    const { userId: authId } = await auth()
    if (!authId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const me = await requireDbUser(authId)
    const count = await getUnreadCount(me.id as string)
    return NextResponse.json({ count })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

