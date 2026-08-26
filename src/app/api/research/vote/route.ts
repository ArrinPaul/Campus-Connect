import { createClient } from "@/lib/supabase/server"
import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { votePaper } from "@/server/db/content"

// POST /api/research/vote
// Body: { paperId: string, voteType?: "up" | "down" }
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const paperId = body.paperId || body.paper_id
    const voteType = body.voteType === "down" ? "down" : "up"

    if (!paperId) {
      return NextResponse.json({ error: "paperId is required" }, { status: 400 })
    }

    const result = await votePaper(paperId, userId, voteType)
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json(result)
  } catch (err) {
    return internalError(err)
  }
}