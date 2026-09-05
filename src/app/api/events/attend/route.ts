import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { attendEvent, unattendEvent } from "@/server/db/events-jobs"

const VALID_STATUSES = new Set(["going", "maybe", "not_going"])

// POST /api/events/attend  body: { eventId, status? }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}));
    const { eventId, status } = body;
    if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 })
    if (status !== undefined && !VALID_STATUSES.has(status)) {
      return NextResponse.json({ error: "status must be one of going, maybe, not_going" }, { status: 400 })
    }

    await attendEvent(eventId, userId, status)
    return NextResponse.json({ success: true })
  } catch (err) {
    return internalError(err)
  }
}

// DELETE /api/events/attend  body: { eventId }
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}));
    const { eventId } = body;
    if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 })

    await unattendEvent(eventId, userId)
    return NextResponse.json({ success: true })
  } catch (err) {
    return internalError(err)
  }
}
