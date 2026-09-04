import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getUserEvents } from "@/server/db/events-jobs"

// GET /api/events/my-events
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const events = await getUserEvents(user.id)
    return NextResponse.json({ events })
  } catch (err) {
    return internalError(err)
  }
}
