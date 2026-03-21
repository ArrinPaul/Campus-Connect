import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { attendEvent, unattendEvent } from "@/server/db/events-jobs"
import { requireDbUser } from "@/server/db/client"

// POST /api/events/attend  body: { eventId }
export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { eventId } = await req.json()
    if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 })

    const me = await requireDbUser(clerkId)
    await attendEvent(eventId, me.id as string)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// DELETE /api/events/attend  body: { eventId }
export async function DELETE(req: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { eventId } = await req.json()
    if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 })

    const me = await requireDbUser(clerkId)
    await unattendEvent(eventId, me.id as string)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
