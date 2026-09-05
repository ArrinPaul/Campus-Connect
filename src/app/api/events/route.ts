import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { parseBody } from "@/lib/validation"
import { NextResponse } from "next/server"
import { getEvents, createEvent } from "@/server/db/events-jobs"
import { z } from "zod"

// The frontend (CreateEventModal.tsx) sends camelCase fields that don't
// match the events table's snake_case columns: eventType/startDate/endDate
// need mapping to event_type/start_time/end_time. virtual_link/
// max_attendees columns were added in migration 20240105000000 to match
// virtualLink/maxAttendees (see docs/TASKS.md §2 for the full history —
// this route used to 400 on every submission before that migration).
const createEventSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(200),
  description: z.string().trim().max(5000).default(""),
  eventType: z.enum(["in_person", "virtual", "hybrid"]).default("in_person"),
  startDate: z.number(),
  endDate: z.number().optional(),
  location: z.string().trim().max(300).optional(),
  virtualLink: z.string().trim().max(500).optional(),
  maxAttendees: z.number().int().positive().optional(),
  communityId: z.string().uuid().optional(),
})

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

    const parsed = await parseBody(req, createEventSchema)
    if ("response" in parsed) return parsed.response
    const { title, description, eventType, startDate, endDate, location, virtualLink, maxAttendees, communityId } = parsed.data
    const event = await createEvent({
      title,
      description,
      event_type: eventType,
      start_time: new Date(startDate).toISOString(),
      end_time: endDate ? new Date(endDate).toISOString() : null,
      location,
      virtual_link: virtualLink,
      max_attendees: maxAttendees,
      community_id: communityId,
      created_by: userId,
    })
    return NextResponse.json(event)
  } catch (err) {
    return internalError(err)
  }
}
