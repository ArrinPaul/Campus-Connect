import { auth } from "@/lib/auth/client"
import { NextResponse } from "next/server"
import { votePoll } from "@/server/db/misc"

// POST /api/polls/vote  body: { pollId, optionIndex }
export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { pollId, optionIndex } = await req.json()
    if (pollId == null || optionIndex == null) {
      return NextResponse.json({ error: "pollId and optionIndex required" }, { status: 400 })
    }

    await votePoll(pollId, userId, optionIndex)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
