import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getPollResults } from "@/server/db/misc"

// GET /api/polls/single?id=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id") || searchParams.get("pollId")
    if (!id) return NextResponse.json({ error: "Poll ID required" }, { status: 400 })

    const poll = await getPollResults(id)
    if (!poll) return NextResponse.json({ error: "Poll not found" }, { status: 404 })

    return NextResponse.json(poll)
  } catch (err) {
    return internalError(err)
  }
}
