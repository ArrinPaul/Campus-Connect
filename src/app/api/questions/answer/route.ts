import { auth } from "@/lib/auth/client"
import { NextResponse } from "next/server"
import { answerQuestion } from "@/server/db/content"

// POST /api/questions/answer  body: { questionId, body }
export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { questionId, body: answerBody } = await req.json()
    if (!questionId || !answerBody) {
      return NextResponse.json({ error: "questionId and body required" }, { status: 400 })
    }

    const answer = await answerQuestion(questionId, userId, answerBody)
    return NextResponse.json(answer)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
