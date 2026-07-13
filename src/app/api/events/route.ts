import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
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
    return internalError(err)
  }
}

// POST /api/events  body: event data
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const event = await createEvent({ ...body, created_by: userId })
    return NextResponse.json(event)
  } catch (err) {
    return internalError(err)
  }
}
