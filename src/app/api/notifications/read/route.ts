import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { markAsRead } from "@/server/db/notifications"
import { requireDbUser } from "@/server/db/client"

// POST /api/notifications/read  body: { notificationId }
export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { notificationId } = await req.json()
    if (!notificationId) return NextResponse.json({ error: "notificationId required" }, { status: 400 })

    const me = await requireDbUser(clerkId)
    await markAsRead(notificationId, me.id as string)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
