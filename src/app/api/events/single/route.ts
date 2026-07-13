import { NextResponse } from "next/server"
import { internalError } from "@/lib/api-error"
import { getEventById } from "@/server/db/events-jobs"

// GET /api/events/single?id=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const event = await getEventById(id)
    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(event)
  } catch (err) {
    return internalError(err)
  }
}
