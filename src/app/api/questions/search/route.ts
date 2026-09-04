import { internalError } from "@/lib/api-error"
import { NextResponse } from "next/server"
import { getQuestions } from "@/server/db/content"

// GET /api/questions/search?q=...&tag=...&sort=votes|unanswered&limit=20&offset=0
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("q") ?? searchParams.get("query") ?? undefined
    const tag = searchParams.get("tag") ?? undefined
    const sort = searchParams.get("sort") ?? undefined
    const limit = parseInt(searchParams.get("limit") ?? "20")
    const offset = parseInt(searchParams.get("offset") ?? "0")

    const questions = await getQuestions(limit, offset, { search, tag, sort })
    return NextResponse.json({ questions, hasMore: questions.length === limit })
  } catch (err) {
    return internalError(err)
  }
}
