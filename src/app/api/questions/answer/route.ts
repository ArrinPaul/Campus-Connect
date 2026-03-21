import { auth } from "@/lib/auth/server"
import { NextResponse } from "next/server"
import { answerQuestion } from "@/server/db/content"
import { requireDbUser } from "@/server/db/client"

// POST /api/questions/answer  body: { questionId, body }
export async function POST(req: Request) {
  try {
    const { userId: authId } = await auth()
    if (!authId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { questionId, body: answerBody } = await req.json()
    if (!questionId || !answerBody) {
      return NextResponse.json({ error: "questionId and body required" }, { status: 400 })
    }

    const me = await requireDbUser(authId)
    const answer = await answerQuestion(questionId, me.id as string, answerBody)
    return NextResponse.json(answer)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

