import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { getEvents, createEvent } from "@/server/db/events-jobs"
import { requireDbUser } from "@/server/db/client"

// GET /api/events?limit=...&cursor=...&communityId=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get("limit") ?? "20")
    const cursor = searchParams.get("cursor") ?? undefined
    const communityId = searchParams.get("communityId") ?? undefined

    const result = await getEvents(limit, cursor, communityId)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// POST /api/events  body: event data
export async function POST(req: Request) {
  try {
    const { userId: authId } = await auth()
    if (!authId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const me = await requireDbUser(authId)
    const body = await req.json()
    const event = await createEvent(me.id as string, body)
    return NextResponse.json(event)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

