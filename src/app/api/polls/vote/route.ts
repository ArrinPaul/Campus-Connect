import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { votePoll } from "@/server/db/misc"
import { requireDbUser } from "@/server/db/client"

// POST /api/polls/vote  body: { pollId, optionIndex }
export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { pollId, optionIndex } = await req.json()
    if (pollId == null || optionIndex == null) {
      return NextResponse.json({ error: "pollId and optionIndex required" }, { status: 400 })
    }

    const me = await requireDbUser(clerkId)
    const result = await votePoll(pollId, me.id as string, optionIndex)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
