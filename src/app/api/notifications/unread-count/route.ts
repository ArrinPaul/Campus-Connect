import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getUnreadCount } from "@/server/db/notifications"

// GET /api/notifications/unread-count
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const count = await getUnreadCount(userId)
    return NextResponse.json({ count })
  } catch (err) {
    return internalError(err)
  }
}
