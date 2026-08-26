import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { submitPaperReview } from "@/server/db/content"

// POST /api/research/review
// Body: { paperId: string, rating: number, comments: string, recommendation?: string }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const paperId = body.paperId || body.paper_id
    const rating = Number(body.rating)
    const comments = String(body.comments || body.content || "").trim()
    const recommendation = body.recommendation

    if (!paperId) {
      return NextResponse.json({ error: "paperId is required" }, { status: 400 })
    }
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "rating must be an integer between 1 and 5" }, { status: 400 })
    }
    if (!comments) {
      return NextResponse.json({ error: "comments are required for peer review" }, { status: 400 })
    }

    const result = await submitPaperReview(paperId, userId, {
      rating,
      comments,
      recommendation,
    })

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    return internalError(err)
  }
}