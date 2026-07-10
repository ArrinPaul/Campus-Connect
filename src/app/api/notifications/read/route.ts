import { auth } from "@/lib/auth/client"
import { NextResponse } from "next/server"
import { markAsRead } from "@/server/db/notifications"

// POST /api/notifications/read  body: { notificationId }
export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { notificationId } = await req.json()
    if (!notificationId) return NextResponse.json({ error: "notificationId required" }, { status: 400 })

    await markAsRead(notificationId)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
