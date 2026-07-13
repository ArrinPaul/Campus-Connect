import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { votePoll } from "@/server/db/misc"

// POST /api/polls/vote  body: { pollId, optionIndex }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { pollId, optionIndex } = await req.json()
    if (pollId == null || optionIndex == null) {
      return NextResponse.json({ error: "pollId and optionIndex required" }, { status: 400 })
    }

    await votePoll(pollId, userId, optionIndex)
    return NextResponse.json({ success: true })
  } catch (err) {
    return internalError(err)
  }
}
