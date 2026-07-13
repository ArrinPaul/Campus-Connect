import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { answerQuestion } from "@/server/db/content"

// POST /api/questions/answer  body: { questionId, body }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { questionId, body: answerBody } = await req.json()
    if (!questionId || !answerBody) {
      return NextResponse.json({ error: "questionId and body required" }, { status: 400 })
    }

    const answer = await answerQuestion(questionId, userId, answerBody)
    return NextResponse.json(answer)
  } catch (err) {
    return internalError(err)
  }
}
