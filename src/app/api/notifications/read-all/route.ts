import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { markAllAsRead } from "@/server/db/notifications"

// POST /api/notifications/read-all
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await markAllAsRead(userId)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
