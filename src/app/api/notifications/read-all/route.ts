import { auth } from "@/lib/auth/client"
import { NextResponse } from "next/server"
import { markAllAsRead } from "@/server/db/notifications"

// POST /api/notifications/read-all
export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await markAllAsRead(userId)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
