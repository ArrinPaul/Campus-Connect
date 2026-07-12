import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { attendEvent, unattendEvent } from "@/server/db/events-jobs"

// POST /api/events/attend  body: { eventId }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { eventId } = await req.json()
    if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 })

    await attendEvent(eventId, userId)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// DELETE /api/events/attend  body: { eventId }
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { eventId } = await req.json()
    if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 })

    await unattendEvent(eventId, userId)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
