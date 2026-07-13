import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { createPoll, getPollResults } from "@/server/db/misc"

// GET /api/polls?pollId=xxx
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const pollId = url.searchParams.get("pollId")
    if (!pollId) return NextResponse.json({ error: "pollId required" }, { status: 400 })

    const results = await getPollResults(pollId)
    if (!results) return NextResponse.json({ error: "Poll not found" }, { status: 404 })

    return NextResponse.json(results)
  } catch (err) {
    return internalError(err)
  }
}

// POST /api/polls  body: { question, options }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    if (!body.question || !body.options?.length) {
      return NextResponse.json({ error: "question and options required" }, { status: 400 })
    }

    const poll = await createPoll({
      question: body.question,
      options: body.options,
      created_by: userId,
    })
    return NextResponse.json(poll, { status: 201 })
  } catch (err) {
    return internalError(err)
  }
}
