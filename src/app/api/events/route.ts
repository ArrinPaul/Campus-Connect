import { auth } from "@/lib/auth/client"
import { NextResponse } from "next/server"
import { getEvents, createEvent } from "@/server/db/events-jobs"

// GET /api/events?limit=...&offset=...&event_type=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get("limit") ?? "20")
    const offset = Number(searchParams.get("offset") ?? "0")
    const event_type = searchParams.get("event_type") ?? undefined
    const result = await getEvents(limit, offset, event_type ? { event_type } : undefined)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// POST /api/events  body: event data
export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const event = await createEvent({ ...body, created_by: userId })
    return NextResponse.json(event)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
