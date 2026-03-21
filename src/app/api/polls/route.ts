import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { createPoll, votePoll } from "@/server/db/misc"
import { requireDbUser } from "@/server/db/client"

// POST /api/polls  body: { question, options, expiresAt? }
export async function POST(req: Request) {
  try {
    const { userId: authId } = await auth()
    if (!authId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const me = await requireDbUser(authId)
    const body = await req.json()
    const poll = await createPoll(me.id as string, body)
    return NextResponse.json(poll)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

