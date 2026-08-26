import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { voteQuestion } from "@/server/db/content"
import { NextResponse } from "next/server"

// POST /api/questions/vote
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const questionId = body.questionId || body.id
    const voteType = body.voteType === "down" ? "down" : "up"

    if (!questionId) {
      return NextResponse.json({ error: "Missing questionId parameter" }, { status: 400 })
    }

    const result = await voteQuestion(questionId, user.id, voteType)
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    return internalError(err)
  }
}