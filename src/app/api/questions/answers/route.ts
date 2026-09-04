import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getQuestionAnswers, answerQuestion } from "@/server/db/content"

// GET /api/questions/answers?questionId=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const questionId = searchParams.get("questionId") ?? searchParams.get("id")
    if (!questionId) return NextResponse.json({ error: "questionId required" }, { status: 400 })

    const answers = await getQuestionAnswers(questionId)
    return NextResponse.json({ answers })
  } catch (err) {
    return internalError(err)
  }
}

// POST /api/questions/answers  body: { questionId, content }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const questionId = body.questionId || body.question_id
    const content = (body.content ?? "").trim()
    if (!questionId || !content) {
      return NextResponse.json({ error: "questionId and content are required" }, { status: 400 })
    }

    const answer = await answerQuestion(questionId, userId, content)
    if (!answer) return NextResponse.json({ error: "Failed to post answer" }, { status: 500 })

    return NextResponse.json(answer, { status: 201 })
  } catch (err) {
    return internalError(err)
  }
}
