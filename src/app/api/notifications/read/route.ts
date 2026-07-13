import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { markAsRead } from "@/server/db/notifications"

// POST /api/notifications/read  body: { notificationId }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { notificationId } = await req.json()
    if (!notificationId) return NextResponse.json({ error: "notificationId required" }, { status: 400 })

    await markAsRead(notificationId)
    return NextResponse.json({ success: true })
  } catch (err) {
    return internalError(err)
  }
}
