import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { markAllAsRead } from "@/server/db/notifications"
import { requireDbUser } from "@/server/db/client"

// POST /api/notifications/read-all
export async function POST() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const me = await requireDbUser(clerkId)
    await markAllAsRead(me.id as string)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
